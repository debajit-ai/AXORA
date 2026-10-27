from sqlalchemy.orm import Session
from app.db import models
from app.schemas import student as schemas

def get_students(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Student).offset(skip).limit(limit).all()

def get_student_by_id(db: Session, student_id: str):
    return db.query(models.Student).filter(models.Student.student_id == student_id).first()

def get_student_attendance(db: Session, student_id: str):
    return db.query(models.AttendanceRecord).filter(models.AttendanceRecord.student_id == student_id).all()

def get_student_courses(db: Session, student_id: str):
    attendance = db.query(models.AttendanceRecord).filter(models.AttendanceRecord.student_id == student_id).all()
    course_ids = [record.course_id for record in attendance]
    return db.query(models.Course).filter(models.Course.id.in_(course_ids)).all()
