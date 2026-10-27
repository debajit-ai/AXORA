from typing import List
from app.agent.goal import Goal
from app.agent.state import Task

class GoalDecomposer:
    def decompose(self, goal: Goal) -> List[Task]:
        if goal.goal_type == "LEAVE_APPLICATION":
            return [
                Task(task_id="t1", description="Identify student", candidate_tools=["get_student_profile"]),
                Task(task_id="t2", description="Retrieve attendance", dependencies=["t1"], candidate_tools=["get_attendance"]),
                Task(task_id="t3", description="Retrieve leave policy", candidate_tools=["get_leave_policy"]),
                Task(task_id="t4", description="Check leave eligibility", dependencies=["t2", "t3"], candidate_tools=["check_leave_eligibility"]),
                Task(task_id="t5", description="Create leave application", dependencies=["t4"], candidate_tools=["create_leave_application"], requires_human_approval=True),
                Task(task_id="t6", description="Verify application status", dependencies=["t5"], candidate_tools=["get_leave_application_status"])
            ]
        raise ValueError(f"Unsupported goal type for decomposition: {goal.goal_type}")
