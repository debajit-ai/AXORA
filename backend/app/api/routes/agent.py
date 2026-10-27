from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.database import get_db
from app.agent.agent import AXORAAgent
from app.agent.result import AgentResult
from app.agent.state import AgentState, Task
from app.schemas.trace import TraceResponse
from app.services.trace_service import get_traces_by_request

router = APIRouter()

class RunRequest(BaseModel):
    student_id: str
    goal: str

@router.post("/run", response_model=AgentResult)
def run_agent(req: RunRequest, db: Session = Depends(get_db)):
    agent = AXORAAgent(db)
    result = agent.start(req.student_id, req.goal)
    return result

@router.get("/{request_id}", response_model=AgentState)
def get_state(request_id: int, db: Session = Depends(get_db)):
    agent = AXORAAgent(db)
    state = agent.get_state(request_id)
    if not state:
        raise HTTPException(status_code=404, detail="State not found")
    return state

@router.get("/{request_id}/plan", response_model=List[Task])
def get_plan(request_id: int, db: Session = Depends(get_db)):
    agent = AXORAAgent(db)
    state = agent.get_state(request_id)
    if not state:
        raise HTTPException(status_code=404, detail="State not found")
    return state.plan

@router.get("/{request_id}/trace", response_model=List[TraceResponse])
def get_trace(request_id: int, db: Session = Depends(get_db)):
    return get_traces_by_request(db, request_id)

@router.post("/{request_id}/approve", response_model=AgentResult)
def approve(request_id: int, db: Session = Depends(get_db)):
    agent = AXORAAgent(db)
    state = agent.get_state(request_id)
    if not state:
        raise HTTPException(status_code=404, detail="Request not found")
    if state.human_approval_status != "PENDING":
        raise HTTPException(status_code=400, detail="Workflow is not waiting for approval")
    res = agent.approve(request_id)
    return res

@router.post("/{request_id}/reject", response_model=AgentResult)
def reject(request_id: int, db: Session = Depends(get_db)):
    agent = AXORAAgent(db)
    state = agent.get_state(request_id)
    if not state:
        raise HTTPException(status_code=404, detail="Request not found")
    if state.human_approval_status != "PENDING":
        raise HTTPException(status_code=400, detail="Workflow is not waiting for approval")
    res = agent.reject(request_id)
    return res
