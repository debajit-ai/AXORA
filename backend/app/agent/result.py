from pydantic import BaseModel
from typing import List, Optional

class AgentResult(BaseModel):
    request_id: int
    status: str
    original_goal: str
    completed_tasks: List[str]
    failed_tasks: List[str]
    replanning_count: int
    human_intervention_count: int = 0
    final_message: str
    execution_time: float = 0.0
    trace_id: Optional[int] = None
