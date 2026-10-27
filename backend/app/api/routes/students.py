from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.services import student_service
from app.schemas import student as schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.StudentResponse])
def get_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return student_service.get_students(db, skip=skip, limit=limit)

@router.get("/{student_id}", response_model=schemas.StudentResponse)
def get_student(student_id: str, db: Session = Depends(get_db)):
    student = student_service.get_student_by_id(db, student_id=student_id)
    if student is None:
        raise HTTPException(status_code=404, detail={"code": "STUDENT_NOT_FOUND", "message": "Student was not found"})
    return student

@router.get("/{student_id}/attendance", response_model=List[schemas.AttendanceRecordResponse])
def get_student_attendance(student_id: str, db: Session = Depends(get_db)):
    student = student_service.get_student_by_id(db, student_id=student_id)
    if student is None:
        raise HTTPException(status_code=404, detail={"code": "STUDENT_NOT_FOUND", "message": "Student was not found"})
    return student_service.get_student_attendance(db, student_id=student_id)

@router.get("/{student_id}/courses", response_model=List[schemas.CourseResponse])
def get_student_courses(student_id: str, db: Session = Depends(get_db)):
    student = student_service.get_student_by_id(db, student_id=student_id)
    if student is None:
        raise HTTPException(status_code=404, detail={"code": "STUDENT_NOT_FOUND", "message": "Student was not found"})
    return student_service.get_student_courses(db, student_id=student_id)
