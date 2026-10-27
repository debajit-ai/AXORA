import pytest
from app.agent.normalizer import GoalNormalizer
from app.agent.planner import Planner
from app.agent.state import Task, AgentState

def test_agent_success(client, db):
    goal_prompt = "I want to apply for leave tomorrow because I have a family function."
    res = client.post("/api/agent/run", json={"student_id": "S001", "goal": goal_prompt})
    assert res.status_code == 200
    data = res.json()
    
    assert data["status"] == "WAITING_FOR_HUMAN"
    assert data["original_goal"] == goal_prompt
    request_id = data["request_id"]
    
    plan_res = client.get(f"/api/agent/{request_id}/plan")
    assert plan_res.status_code == 200
    plan = plan_res.json()
    assert len(plan) == 6
    assert plan[0]["task_id"] == "t1"
    
    app_res = client.post(f"/api/agent/{request_id}/approve")
    assert app_res.status_code == 200
    app_data = app_res.json()
    assert app_data["status"] == "COMPLETED"
    assert app_data["original_goal"] == goal_prompt
    assert len(app_data["completed_tasks"]) == 6
    assert app_data["failed_tasks"] == []
    
    trace_res = client.get(f"/api/agent/{request_id}/trace")
    assert trace_res.status_code == 200
    traces = trace_res.json()
    events = [t["event_type"] for t in traces]
    
    # Verify chronological ordering by step_number
    step_numbers = [t["step_number"] for t in traces]
    assert step_numbers == sorted(step_numbers)
    assert len(step_numbers) == len(set(step_numbers))  # Strictly monotonic
    
    assert "GOAL_RECEIVED" in events
    assert "GOAL_NORMALIZED" in events
    assert "GOAL_DECOMPOSED" in events
    assert "PLAN_CREATED" in events
    assert "TOOL_SELECTED" in events
    assert "TOOL_STARTED" in events
    assert "TOOL_COMPLETED" in events
    assert "OBSERVATION_RECEIVED" in events
    assert "HUMAN_APPROVAL_REQUIRED" in events
    assert "HUMAN_APPROVED" in events
    assert "WORKFLOW_COMPLETED" in events

def test_agent_recoverable_failure(client, db):
    goal_prompt = "FAILURE_MODE=attendance_timeout"
    res = client.post("/api/agent/run", json={"student_id": "S001", "goal": goal_prompt})
    assert res.status_code == 200
    data = res.json()
    
    assert data["status"] == "WAITING_FOR_HUMAN"
    assert data["original_goal"] == goal_prompt  # Original goal is preserved, NOT overwritten with 'RECOVERED'
    assert data["replanning_count"] == 1
    
    trace_res = client.get(f"/api/agent/{data['request_id']}/trace")
    events = [t["event_type"] for t in trace_res.json()]
    assert "TOOL_FAILED" in events
    assert "REPLAN_TRIGGERED" in events

def test_agent_human_rejection(client, db):
    goal_prompt = "I want to apply for leave tomorrow."
    res = client.post("/api/agent/run", json={"student_id": "S001", "goal": goal_prompt})
    assert res.status_code == 200
    request_id = res.json()["request_id"]
    
    app_res = client.post(f"/api/agent/{request_id}/reject")
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "FAILED"
    assert "Human rejected" in app_res.json()["final_message"]
    
    trace_res = client.get(f"/api/agent/{request_id}/trace")
    events = [t["event_type"] for t in trace_res.json()]
    assert "HUMAN_REJECTED" in events
    assert "WORKFLOW_FAILED" in events

def test_agent_non_recoverable_failure(client, db):
    goal_prompt = "FAILURE_MODE=unrecoverable"
    res = client.post("/api/agent/run", json={"student_id": "S001", "goal": goal_prompt})
    assert res.status_code == 200
    data = res.json()
    
    assert data["status"] == "FAILED"
    assert data["original_goal"] == goal_prompt
    
    trace_res = client.get(f"/api/agent/{data['request_id']}/trace")
    events = [t["event_type"] for t in trace_res.json()]
    assert "TOOL_FAILED" in events
    assert "WORKFLOW_FAILED" in events

def test_agent_bounded_replanning_limit(client, db):
    # Test that persistent recoverable errors respect MAX_REPLANS (3) and terminate
    goal_prompt = "FAILURE_MODE=attendance_timeout_persistent"
    res = client.post("/api/agent/run", json={"student_id": "S001", "goal": goal_prompt})
    assert res.status_code == 200
    data = res.json()
    
    assert data["status"] == "FAILED"
    assert data["replanning_count"] == 3
    assert "Max replanning limit reached" in data["final_message"]

def test_agent_ineligible_student(client, db):
    # Student S002 has only 50% attendance (< 75% required)
    res = client.post("/api/agent/run", json={"student_id": "S002", "goal": "I need leave for 2 days"})
    assert res.status_code == 200
    data = res.json()
    
    # Workflow must fail at eligibility check and not proceed to human approval
    assert data["status"] == "FAILED"
    assert "below 75%" in data["final_message"]

def test_goal_normalization_structured_data():
    normalizer = GoalNormalizer()
    
    # Test case 1: Reason and days extracted
    goal1 = normalizer.normalize("S001", "Apply for leave for 3 days due to medical reasons")
    assert goal1.goal_type == "LEAVE_APPLICATION"
    assert goal1.student_id == "S001"
    assert goal1.parameters["days"] == 3
    assert goal1.parameters["reason"] == "medical reasons"
    
    # Test case 2: Family function
    goal2 = normalizer.normalize("S001", "I need 1 day leave because I have a family function")
    assert goal2.parameters["days"] == 1
    assert goal2.parameters["reason"] == "family function"
    
    # Test case 3: Failure mode parsing
    goal3 = normalizer.normalize("S001", "FAILURE_MODE=attendance_timeout")
    assert goal3.parameters["failure_mode"] == "attendance_timeout"

def test_planner_topological_dependency_sorting():
    planner = Planner()
    state = AgentState(request_id=999, student_id="S001")
    
    # Define tasks out of dependency order (t2 before t1, t4 before t3)
    t1 = Task(task_id="t1", description="Step 1", dependencies=[], candidate_tools=["get_student_profile"])
    t2 = Task(task_id="t2", description="Step 2", dependencies=["t1"], candidate_tools=["get_attendance"])
    t3 = Task(task_id="t3", description="Step 3", dependencies=[], candidate_tools=["get_leave_policy"])
    t4 = Task(task_id="t4", description="Step 4", dependencies=["t2", "t3"], candidate_tools=["check_leave_eligibility"])
    
    out_of_order = [t4, t2, t3, t1]
    sorted_plan = planner.create_plan(out_of_order, state)
    sorted_ids = [t.task_id for t in sorted_plan]
    
    # Verify t1 comes before t2, and t2 and t3 come before t4
    assert sorted_ids.index("t1") < sorted_ids.index("t2")
    assert sorted_ids.index("t2") < sorted_ids.index("t4")
    assert sorted_ids.index("t3") < sorted_ids.index("t4")
    
    # Test cycle detection
    t_cycle1 = Task(task_id="c1", description="Cycle 1", dependencies=["c2"])
    t_cycle2 = Task(task_id="c2", description="Cycle 2", dependencies=["c1"])
    with pytest.raises(ValueError, match="Circular dependency"):
        planner.create_plan([t_cycle1, t_cycle2], state)

def test_agent_api_error_handling(client):
    # 404 on non-existent state
    res = client.get("/api/agent/99999")
    assert res.status_code == 404
    
    # 404 on approve non-existent request
    res = client.post("/api/agent/99999/approve")
    assert res.status_code == 404
    
    # 404 on reject non-existent request
    res = client.post("/api/agent/99999/reject")
    assert res.status_code == 404
