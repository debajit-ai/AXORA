from sqlalchemy.orm import Session
from app.db import models
from app.schemas import trace as schemas

def create_trace(db: Session, trace: schemas.TraceCreate):
    db_trace = models.DecisionTrace(**trace.model_dump())
    db.add(db_trace)
    db.commit()
    db.refresh(db_trace)
    return db_trace

def get_traces_by_request(db: Session, request_id: int):
    return db.query(models.DecisionTrace).filter(models.DecisionTrace.request_id == request_id).order_by(models.DecisionTrace.step_number).all()
