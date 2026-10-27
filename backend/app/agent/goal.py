from pydantic import BaseModel
from typing import Dict, Any, List

class Goal(BaseModel):
    goal_type: str
    student_id: str
    parameters: Dict[str, Any]
    constraints: List[str] = []
