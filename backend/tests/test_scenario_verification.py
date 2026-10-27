import json
import pytest
from unittest.mock import patch
from app.db.models import DecisionTrace, CampusRequest

def test_scenario_1_normal_leave_workflow(client, db):
    """
    Scenario 1: Normal Leave Workflow
    Confirm task dependency order, successful completion, and trace records.
    """
    goal = "I want to apply for leave for 2 days due to medical reasons."
    response = client.post("/api/agent/run", json={"student_id": "S001", "goal": goal})
    assert response.status_code == 200
    init_data = response.json()

    # Agent must pause before consequential action t5
    assert init_data["status"] == "WAITING_FOR_HUMAN"
    request_id = init_data["request_id"]

    # Verify plan and topological dependency order
    plan_res = client.get(f"/api/agent/{request_id}/plan")
    assert plan_res.status_code == 200
    plan = plan_res.json()
    task_ids = [t["task_id"] for t in plan]
    assert task_ids == ["t1", "t3", "t2", "t4", "t5", "t6"]

    # Verify intermediate state before human approval
    state_res = client.get(f"/api/agent/{request_id}")
    assert state_res.status_code == 200
    mid_state = state_res.json()
    assert mid_state["completed_tasks"] == ["t1", "t3", "t2", "t4"]
    assert mid_state["pending_tasks"] == ["t5", "t6"]
    assert mid_state["human_approval_required"] is True
    assert mid_state["human_approval_status"] == "PENDING"

    # Approve the workflow
    approve_res = client.post(f"/api/agent/{request_id}/approve")
    assert approve_res.status_code == 200
    final_data = approve_res.json()

    # Confirm successful completion
    assert final_data["status"] == "COMPLETED"
    assert final_data["completed_tasks"] == ["t1", "t3", "t2", "t4", "t5", "t6"]
    assert final_data["failed_tasks"] == []
    assert final_data["replanning_count"] == 0
    assert final_data["human_intervention_count"] == 1
    assert "Goal achieved successfully" in final_data["final_message"]

    # Confirm trace records
    trace_res = client.get(f"/api/agent/{request_id}/trace")
    assert trace_res.status_code == 200
    traces = trace_res.json()
    events = [t["event_type"] for t in traces]

    expected_events_prefix = [
        "GOAL_RECEIVED",
        "GOAL_NORMALIZED",
        "GOAL_DECOMPOSED",
        "PLAN_CREATED",
    ]
    for ev in expected_events_prefix:
        assert ev in events

    assert "HUMAN_APPROVAL_REQUIRED" in events
    assert "HUMAN_APPROVED" in events
    assert events[-1] == "WORKFLOW_COMPLETED"

    # Strictly monotonic step numbers
    step_numbers = [t["step_number"] for t in traces]
    assert step_numbers == list(range(1, len(traces) + 1))


def test_scenario_2_transient_tool_failure_recovery(client, db):
    """
    Scenario 2: Transient Tool Failure
    Verify that the agent encounters a recoverable tool failure, retries/replans,
    heals itself, and successfully proceeds to completion upon approval.
    """
    goal = "FAILURE_MODE=attendance_timeout"
    response = client.post("/api/agent/run", json={"student_id": "S001", "goal": goal})
    assert response.status_code == 200
    init_data = response.json()

    # Should pause at WAITING_FOR_HUMAN after successfully recovering and evaluating eligibility
    assert init_data["status"] == "WAITING_FOR_HUMAN"
    assert init_data["replanning_count"] == 1
    request_id = init_data["request_id"]

    # Trace inspection for recovery pattern
    trace_res = client.get(f"/api/agent/{request_id}/trace")
    traces = trace_res.json()
    events = [t["event_type"] for t in traces]

    # Verify tool failure followed by replan triggered and then successful execution
    assert "TOOL_FAILED" in events
    assert "REPLAN_TRIGGERED" in events

    fail_idx = events.index("TOOL_FAILED")
    assert traces[fail_idx]["error_message"] == "attendance_timeout"
    assert traces[fail_idx]["status"] == "failure"

    # Observation right after TOOL_FAILED must be RECOVERABLE_FAILURE
    obs_idx = fail_idx + 1
    assert traces[obs_idx]["event_type"] == "OBSERVATION_RECEIVED"
    assert traces[obs_idx]["output_data"] == "RECOVERABLE_FAILURE"

    # Replan triggered
    replan_idx = obs_idx + 1
    assert traces[replan_idx]["event_type"] == "REPLAN_TRIGGERED"

    # Workflow can be approved and finishes successfully
    app_res = client.post(f"/api/agent/{request_id}/approve")
    assert app_res.status_code == 200
    final_data = app_res.json()
    assert final_data["status"] == "COMPLETED"
    assert len(final_data["completed_tasks"]) == 6
    assert final_data["failed_tasks"] == []
    assert final_data["replanning_count"] == 1


def test_scenario_3_persistent_tool_failure_bounded_retries(client, db):
    """
    Scenario 3: Persistent Tool Failure
    Confirm retries are strictly bounded by MAX_REPLANS (3) and workflow terminates safely.
    """
    goal = "FAILURE_MODE=attendance_timeout_persistent"
    response = client.post("/api/agent/run", json={"student_id": "S001", "goal": goal})
    assert response.status_code == 200
    data = response.json()

    # Status must be FAILED, not infinite loop
    assert data["status"] == "FAILED"
    assert data["replanning_count"] == 3
    assert "Max replanning limit reached" in data["final_message"]
    assert "t2" in data["failed_tasks"]

    # Subsequent tasks t4, t5, t6 must NOT have executed
    assert "t4" not in data["completed_tasks"]
    assert "t5" not in data["completed_tasks"]
    assert "t6" not in data["completed_tasks"]

    # Verify traces count exactly 3 REPLAN_TRIGGERED and 4 TOOL_FAILED before WORKFLOW_FAILED
    trace_res = client.get(f"/api/agent/{data['request_id']}/trace")
    traces = trace_res.json()
    events = [t["event_type"] for t in traces]

    replan_events = [e for e in events if e == "REPLAN_TRIGGERED"]
    assert len(replan_events) == 3

    tool_failed_events = [e for e in events if e == "TOOL_FAILED"]
    assert len(tool_failed_events) == 4

    assert events[-1] == "WORKFLOW_FAILED"
    assert traces[-1]["status"] == "failure"
    assert "Max replanning limit reached" in traces[-1]["error_message"]


def test_scenario_4_simulated_database_failure(client, db):
    """
    Scenario 4: Simulated Database Failure (Unrecoverable)
    Inspect final state, error handling and trace for database corruption.
    """
    goal = "FAILURE_MODE=unrecoverable"
    response = client.post("/api/agent/run", json={"student_id": "S001", "goal": goal})
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "FAILED"
    assert data["replanning_count"] == 0  # Should NOT retry on unrecoverable DB error
    assert "database_corrupted" in data["final_message"]
    assert "t1" in data["failed_tasks"]
    assert data["completed_tasks"] == []

    # Trace inspection
    trace_res = client.get(f"/api/agent/{data['request_id']}/trace")
    traces = trace_res.json()
    events = [t["event_type"] for t in traces]

    assert "TOOL_FAILED" in events
    fail_trace = next(t for t in traces if t["event_type"] == "TOOL_FAILED")
    assert fail_trace["error_message"] == "database_corrupted"

    obs_trace = next(t for t in traces if t["event_type"] == "OBSERVATION_RECEIVED")
    assert obs_trace["output_data"] == "NON_RECOVERABLE_FAILURE"

    assert "REPLAN_TRIGGERED" not in events
    assert events[-1] == "WORKFLOW_FAILED"


def test_scenario_4b_actual_database_exception_handling(client, db):
    """
    Scenario 4b: Actual DB / Tool Exception Handling
    Confirm an unexpected Python exception raised inside a tool execute method
    is caught, logged as TOOL_FAILED, and terminates cleanly without 500 error.
    """
    from app.tools.registry import registry
    profile_tool = registry.get_tool("get_student_profile")

    with patch.object(profile_tool, "execute", side_effect=RuntimeError("Simulated Database I/O Error")):
        response = client.post("/api/agent/run", json={"student_id": "S001", "goal": "I need leave"})
        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "FAILED"
        assert "Simulated Database I/O Error" in data["final_message"]
        assert "t1" in data["failed_tasks"]

        trace_res = client.get(f"/api/agent/{data['request_id']}/trace")
        traces = trace_res.json()
        fail_trace = next(t for t in traces if t["event_type"] == "TOOL_FAILED")
        assert "Simulated Database I/O Error" in fail_trace["error_message"]


def test_scenario_5_human_rejection_prevents_consequential_action(client, db):
    """
    Scenario 5: Human Rejection
    Confirm the consequential leave-application creation action does not execute after rejection.
    """
    goal = "I want to apply for 1 day leave due to personal reasons."
    response = client.post("/api/agent/run", json={"student_id": "S001", "goal": goal})
    assert response.status_code == 200
    request_id = response.json()["request_id"]

    # Reject the workflow
    reject_res = client.post(f"/api/agent/{request_id}/reject")
    assert reject_res.status_code == 200
    reject_data = reject_res.json()

    assert reject_data["status"] == "FAILED"
    assert "Human rejected" in reject_data["final_message"]
    assert reject_data["human_intervention_count"] == 1

    # CRITICAL AUDIT CHECK: t5 must NOT have completed
    assert "t5" not in reject_data["completed_tasks"]
    assert "t6" not in reject_data["completed_tasks"]

    # State check
    state_res = client.get(f"/api/agent/{request_id}")
    state = state_res.json()
    assert state["current_status"] == "FAILED"
    assert state["human_approval_status"] == "REJECTED"
    assert "t5" in state["pending_tasks"]
    assert "t5" not in state["selected_tools"]
    assert "t5" not in state["tool_results"]

    # Trace check: create_leave_application was NEVER started or completed
    trace_res = client.get(f"/api/agent/{request_id}/trace")
    traces = trace_res.json()
    executed_tools = [t.get("output_data") for t in traces if t["event_type"] == "TOOL_SELECTED"]
    assert "create_leave_application" not in executed_tools
    assert "get_leave_application_status" not in executed_tools

    # Calling approve or reject after rejection must fail with HTTP 400
    approve_again = client.post(f"/api/agent/{request_id}/approve")
    assert approve_again.status_code == 400

    reject_again = client.post(f"/api/agent/{request_id}/reject")
    assert reject_again.status_code == 400


def test_scenario_6_human_approval_resumes_without_duplicate_action(client, db):
    """
    Scenario 6: Human Approval
    Confirm execution resumes correctly without repeating completed actions
    or creating duplicate applications.
    """
    goal = "I need to apply for leave for 1 day because I have a family function."
    response = client.post("/api/agent/run", json={"student_id": "S001", "goal": goal})
    assert response.status_code == 200
    request_id = response.json()["request_id"]

    # Capture tools run before human approval
    trace_before = client.get(f"/api/agent/{request_id}/trace").json()
    tools_before = [t["input_data"] for t in trace_before if t["event_type"] == "TOOL_STARTED"]

    # Approve
    approve_res = client.post(f"/api/agent/{request_id}/approve")
    assert approve_res.status_code == 200
    app_data = approve_res.json()

    assert app_data["status"] == "COMPLETED"
    assert app_data["completed_tasks"] == ["t1", "t3", "t2", "t4", "t5", "t6"]
    assert app_data["human_intervention_count"] == 1

    # Verify tool execution counts in traces
    trace_after = client.get(f"/api/agent/{request_id}/trace").json()
    completed_tool_traces = [t for t in trace_after if t["event_type"] == "TOOL_COMPLETED"]

    # Exactly 6 tool completions for the 6 tasks
    assert len(completed_tool_traces) == 6

    # Verify create_leave_application was executed exactly once
    tool_starts = [t for t in trace_after if t["event_type"] == "TOOL_STARTED"]
    assert len(tool_starts) == 6

    # Repeated approve calls must fail and NOT repeat create_leave_application
    duplicate_approve = client.post(f"/api/agent/{request_id}/approve")
    assert duplicate_approve.status_code == 400

    duplicate_reject = client.post(f"/api/agent/{request_id}/reject")
    assert duplicate_reject.status_code == 400


def test_scenario_7_execution_trace_integrity(client, db):
    """
    Scenario 7: Execution Trace Fidelity
    Verify that recorded events, components, actions and statuses match the actual execution sequence.
    """
    goal = "I want to apply for leave tomorrow because I have a family function."
    res = client.post("/api/agent/run", json={"student_id": "S001", "goal": goal})
    request_id = res.json()["request_id"]
    client.post(f"/api/agent/{request_id}/approve")

    trace_res = client.get(f"/api/agent/{request_id}/trace")
    assert trace_res.status_code == 200
    traces = trace_res.json()

    # 1. Monotonic and contiguous step_number
    step_numbers = [t["step_number"] for t in traces]
    assert step_numbers == list(range(1, len(traces) + 1))

    # 2. Every trace must have timestamp and correct request_id
    for t in traces:
        assert t["request_id"] == request_id
        assert t["timestamp"] is not None
        assert t["component"] in ["orchestrator", "decomposer", "planner", "tool_selector", "executor", "observer", "replanner"]
        assert t["status"] in ["success", "failure", "pending"]

    # 3. Tool lifecycle pairing: TOOL_STARTED -> TOOL_COMPLETED -> OBSERVATION_RECEIVED
    events = [t["event_type"] for t in traces]
    for i, event in enumerate(events):
        if event == "TOOL_STARTED":
            assert i + 1 < len(events)
            next_ev = events[i + 1]
            assert next_ev in ["TOOL_COMPLETED", "TOOL_FAILED"]
            assert i + 2 < len(events)
            assert events[i + 2] == "OBSERVATION_RECEIVED"
