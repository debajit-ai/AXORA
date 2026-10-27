from pydantic import BaseModel
from typing import Dict, Any, Optional

class ToolSchema(BaseModel):
    name: str
    description: str
    category: str
    input_schema: Dict[str, Any]
    requires_human_approval: bool
