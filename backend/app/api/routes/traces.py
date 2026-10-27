from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.services import trace_service
from app.schemas import trace as schemas

router = APIRouter()

@router.get("/{request_id}", response_model=List[schemas.TraceResponse])
def get_traces(request_id: int, db: Session = Depends(get_db)):
    return trace_service.get_traces_by_request(db, request_id=request_id)
