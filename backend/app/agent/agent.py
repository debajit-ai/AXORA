import json
import time
from sqlalchemy.orm import Session
from app.agent.state import AgentState, Task
from app.agent.goal import Goal
from app.agent.normalizer import GoalNormalizer
from app.agent.decomposer import GoalDecomposer
from app.agent.planner import Planner
from app.agent.tool_selector import ToolSelector
from app.agent.observer import Observer, ObservationResult
from app.agent.replanner import Replanner
from app.agent.policies import PolicyEngine
from app.agent.result import AgentResult
from app.tools.registry import registry
from app.services.trace_service import create_trace
from app.schemas.trace import TraceCreate
from app.db.models import AgentStateModel, CampusRequest

class AXORAAgent:
    def __init__(self, db: Session):
        self.db = db
        self.normalizer = GoalNormalizer()
        self.decomposer = GoalDecomposer()
        self.planner = Planner()
        self.tool_selector = ToolSelector()
        self.observer = Observer()
        self.replanner = Replanner()
        self.policy_engine = PolicyEngine()
        
    def _log_trace(self, request_id: int, step_number: int, event_type: str, component: str, action: str, status: str, input_data: str = None, output_data: str = None, error_message: str = None):
        try:
            create_trace(self.db, TraceCreate(
                request_id=request_id,
                step_number=step_number,
                event_type=event_type,
                component=component,
                action=action,
                status=status,
                input_data=input_data,
                output_data=output_data,
                error_message=error_message
            ))
        except Exception:
            try:
                self.db.rollback()
            except Exception:
                pass

    def _save_state(self, state: AgentState):
        try:
            model = self.db.query(AgentStateModel).filter(AgentStateModel.request_id == state.request_id).first()
            if not model:
                model = AgentStateModel(request_id=state.request_id, state_data=state.model_dump_json())
                self.db.add(model)
            else:
                model.state_data = state.model_dump_json()

            # Keep CampusRequest status synchronized with AgentState
            req = self.db.query(CampusRequest).filter(CampusRequest.id == state.request_id).first()
            if req:
                req.status = state.current_status.lower()

            self.db.commit()
        except Exception:
            try:
                self.db.rollback()
            except Exception:
                pass

    def get_state(self, request_id: int) -> AgentState:
        model = self.db.query(AgentStateModel).filter(AgentStateModel.request_id == request_id).first()
        if model:
            return AgentState.model_validate_json(model.state_data)
        return None

    def start(self, student_id: str, goal_text: str) -> AgentResult:
        start_time = time.time()
        # Create a new CampusRequest
        req = CampusRequest(student_id=student_id, request_type="agent_workflow", description=goal_text)
        self.db.add(req)
        self.db.commit()
        self.db.refresh(req)
        
        state = AgentState(request_id=req.id, student_id=student_id, original_goal=goal_text)
        state.current_step += 1
        self._log_trace(state.request_id, state.current_step, "GOAL_RECEIVED", "orchestrator", "start", "success", input_data=goal_text)
        self._save_state(state)
        
        return self.run(state.request_id, start_time=start_time)

    def run(self, request_id: int, start_time: float = None) -> AgentResult:
        if start_time is None:
            start_time = time.time()

        state = self.get_state(request_id)
        if not state:
            raise ValueError(f"State not found for request_id {request_id}")

        try:
            if state.current_status == "IDLE":
                state.current_status = "UNDERSTANDING"
                
                # 1. Deterministic Goal Normalization
                goal = self.normalizer.normalize(state.student_id, state.original_goal)
                state.normalized_goal = goal.model_dump()
                state.current_step += 1
                self._log_trace(state.request_id, state.current_step, "GOAL_NORMALIZED", "orchestrator", "normalize", "success", output_data=json.dumps(state.normalized_goal))
                
                # 2. Goal Decomposition
                tasks = self.decomposer.decompose(goal)
                state.current_step += 1
                self._log_trace(state.request_id, state.current_step, "GOAL_DECOMPOSED", "decomposer", "decompose", "success", output_data=json.dumps([t.model_dump() for t in tasks]))
                
                state.current_status = "PLANNING"
                
                # 3. Topological Dependency Planning
                self.planner.create_plan(tasks, state)
                state.current_step += 1
                self._log_trace(state.request_id, state.current_step, "PLAN_CREATED", "planner", "plan", "success", output_data=json.dumps([t.model_dump() for t in state.plan]))
                
                state.current_status = "EXECUTING"

            while state.current_status == "EXECUTING" and state.pending_tasks:
                if state.human_approval_status == "REJECTED":
                    state.current_status = "FAILED"
                    state.error = "Human rejected the workflow."
                    state.current_step += 1
                    self._log_trace(state.request_id, state.current_step, "WORKFLOW_FAILED", "orchestrator", "terminate", "failure", error_message=state.error)
                    break

                task_id = state.pending_tasks[0]
                task = next((t for t in state.plan if t.task_id == task_id), None)
                if not task:
                    raise ValueError(f"Task '{task_id}' not found in current plan")

                # Verify task dependencies
                unmet_deps = [dep for dep in task.dependencies if dep not in state.completed_tasks]
                if unmet_deps:
                    raise ValueError(f"Task '{task_id}' has unmet dependencies: {unmet_deps}")
                
                # Check human approval requirement
                if task.requires_human_approval and state.human_approval_status != "APPROVED":
                    state.current_status = "WAITING_FOR_HUMAN"
                    state.human_approval_required = True
                    state.human_approval_status = "PENDING"
                    state.current_step += 1
                    self._log_trace(state.request_id, state.current_step, "HUMAN_APPROVAL_REQUIRED", "orchestrator", "pause", "pending")
                    self._save_state(state)
                    return self._build_result(state, "Waiting for human approval", start_time=start_time)

                state.current_step += 1
                tool_name = self.tool_selector.select_tool(task)
                state.selected_tools[task_id] = tool_name
                self._log_trace(state.request_id, state.current_step, "TOOL_SELECTED", "tool_selector", "select", "success", output_data=tool_name)
                
                if not self.policy_engine.validate_tool_execution(tool_name):
                    raise ValueError(f"Tool {tool_name} failed policy check")

                tool = registry.get_tool(tool_name)
                kwargs = {}
                if "student_id" in tool.input_schema.get("properties", {}):
                    kwargs["student_id"] = state.student_id
                if tool_name == "create_leave_application":
                    params = state.normalized_goal.get("parameters", {}) if state.normalized_goal else {}
                    kwargs["reason"] = params.get("reason", "personal leave")
                    kwargs["days"] = params.get("days", 1)
                
                state.current_step += 1
                self._log_trace(state.request_id, state.current_step, "TOOL_STARTED", "executor", "execute", "pending", input_data=json.dumps(kwargs))
                
                # Failure simulation support for testing
                failure_mode = ""
                if state.normalized_goal and "failure_mode" in state.normalized_goal.get("parameters", {}):
                    failure_mode = state.normalized_goal["parameters"]["failure_mode"]
                elif "FAILURE_MODE=" in state.original_goal:
                    failure_mode = state.original_goal.split("FAILURE_MODE=")[-1].strip().lower()

                if "attendance_timeout" in failure_mode and tool_name == "get_attendance":
                    # Transient simulated failure on attempt 1; persistent if requested
                    if "persistent" in failure_mode or state.replanning_count == 0:
                        result = {"error": "attendance_timeout"}
                        state.current_step += 1
                        self._log_trace(state.request_id, state.current_step, "TOOL_FAILED", "executor", "execute", "failure", error_message="attendance_timeout")
                    else:
                        result = tool.execute(db=self.db, **kwargs)
                        state.current_step += 1
                        self._log_trace(state.request_id, state.current_step, "TOOL_COMPLETED", "executor", "execute", "success", output_data=json.dumps(result))
                elif "unrecoverable" in failure_mode and tool_name == "get_student_profile":
                    result = {"error": "database_corrupted"}
                    state.current_step += 1
                    self._log_trace(state.request_id, state.current_step, "TOOL_FAILED", "executor", "execute", "failure", error_message="database_corrupted")
                else:
                    try:
                        result = tool.execute(db=self.db, **kwargs)
                        state.current_step += 1
                        self._log_trace(state.request_id, state.current_step, "TOOL_COMPLETED", "executor", "execute", "success", output_data=json.dumps(result))
                    except Exception as e:
                        result = {"error": str(e)}
                        state.current_step += 1
                        self._log_trace(state.request_id, state.current_step, "TOOL_FAILED", "executor", "execute", "failure", error_message=str(e))
                
                state.tool_results[task_id] = result
                
                state.current_status = "OBSERVING"
                obs = self.observer.observe(tool_name, result)
                state.observations.append({"task_id": task_id, "observation": obs})
                state.current_step += 1
                self._log_trace(state.request_id, state.current_step, "OBSERVATION_RECEIVED", "observer", "observe", "success", output_data=obs)
                
                if obs == ObservationResult.SUCCESS:
                    state.pending_tasks.pop(0)
                    state.completed_tasks.append(task_id)
                    if task_id in state.failed_tasks:
                        state.failed_tasks.remove(task_id)
                    task.status = "COMPLETED"
                    state.current_status = "EXECUTING"
                    if task.requires_human_approval:
                        state.human_approval_required = False
                elif obs == ObservationResult.RECOVERABLE_FAILURE:
                    state.current_status = "REPLANNING"
                    if task_id not in state.failed_tasks:
                        state.failed_tasks.append(task_id)
                    task.status = "FAILED"
                    if self.replanner.can_replan(state):
                        state.pending_tasks.pop(0)
                        self.replanner.replan(state, task_id)
                        state.current_step += 1
                        self._log_trace(state.request_id, state.current_step, "REPLAN_TRIGGERED", "replanner", "replan", "success")
                        state.current_status = "EXECUTING"
                    else:
                        state.current_status = "FAILED"
                        state.error = "Max replanning limit reached."
                        state.current_step += 1
                        self._log_trace(state.request_id, state.current_step, "WORKFLOW_FAILED", "orchestrator", "terminate", "failure", error_message=state.error)
                        break
                else:
                    state.current_status = "FAILED"
                    if task_id not in state.failed_tasks:
                        state.failed_tasks.append(task_id)
                    task.status = "FAILED"
                    err_msg = ""
                    if isinstance(result, dict):
                        err_msg = result.get("error") or result.get("reason") or ""
                    state.error = f"Unrecoverable failure on task {task_id}: {err_msg}".strip(": ")
                    state.current_step += 1
                    self._log_trace(state.request_id, state.current_step, "WORKFLOW_FAILED", "orchestrator", "terminate", "failure", error_message=state.error)
                    break

            if state.current_status == "EXECUTING" and not state.pending_tasks:
                state.current_status = "COMPLETED"
                state.final_result = "Goal achieved successfully."
                state.current_step += 1
                self._log_trace(state.request_id, state.current_step, "WORKFLOW_COMPLETED", "orchestrator", "complete", "success")

        except Exception as e:
            state.current_status = "FAILED"
            state.error = str(e)
            if state.pending_tasks:
                failed_tid = state.pending_tasks[0]
                if failed_tid not in state.failed_tasks:
                    state.failed_tasks.append(failed_tid)
                for t in state.plan:
                    if t.task_id == failed_tid:
                        t.status = "FAILED"
            state.current_step += 1
            self._log_trace(state.request_id, state.current_step, "WORKFLOW_FAILED", "orchestrator", "terminate", "failure", error_message=str(e))

        self._save_state(state)
        return self._build_result(state, state.final_result or state.error or "Workflow paused", start_time=start_time)

    def _build_result(self, state: AgentState, message: str, start_time: float = None) -> AgentResult:
        exec_time = 0.0
        if start_time:
            exec_time = round(time.time() - start_time, 3)

        has_human_intervention = (
            state.human_approval_required
            or state.human_approval_status in ["APPROVED", "REJECTED"]
        )
        return AgentResult(
            request_id=state.request_id,
            status=state.current_status,
            original_goal=state.original_goal,
            completed_tasks=state.completed_tasks,
            failed_tasks=state.failed_tasks,
            replanning_count=state.replanning_count,
            human_intervention_count=1 if has_human_intervention else 0,
            final_message=message,
            execution_time=exec_time,
            trace_id=state.request_id
        )
        
    def approve(self, request_id: int):
        state = self.get_state(request_id)
        if state and state.human_approval_status == "PENDING":
            state.human_approval_status = "APPROVED"
            state.current_status = "EXECUTING"
            state.current_step += 1
            self._log_trace(state.request_id, state.current_step, "HUMAN_APPROVED", "orchestrator", "approve", "success")
            self._save_state(state)
            return self.run(request_id)
        return None
        
    def reject(self, request_id: int):
        state = self.get_state(request_id)
        if state and state.human_approval_status == "PENDING":
            state.human_approval_status = "REJECTED"
            state.current_status = "EXECUTING"
            state.current_step += 1
            self._log_trace(state.request_id, state.current_step, "HUMAN_REJECTED", "orchestrator", "reject", "success")
            self._save_state(state)
            return self.run(request_id)
        return None
