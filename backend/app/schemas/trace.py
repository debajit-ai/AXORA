from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class TraceBase(BaseModel):
    request_id: Optional[int] = None
    step_number: int
    event_type: str
    component: str
    action: str
    input_data: Optional[str] = None
    output_data: Optional[str] = None
    status: str
    error_message: Optional[str] = None

class TraceCreate(TraceBase):
    pass

class TraceResponse(TraceBase):
    id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
