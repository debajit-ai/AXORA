from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.database import Base

def get_utc_now():
    return datetime.now(timezone.utc)

class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    program = Column(String, nullable=False)
    semester = Column(Integer, nullable=False)
    
    attendance_records = relationship("AttendanceRecord", back_populates="student")
    requests = relationship("CampusRequest", back_populates="student")

class Course(Base):
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String, unique=True, index=True, nullable=False)
    course_name = Column(String, nullable=False)
    faculty = Column(String, nullable=False)

    attendance_records = relationship("AttendanceRecord", back_populates="course")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    attended_classes = Column(Integer, default=0)
    total_classes = Column(Integer, default=0)
    
    student = relationship("Student", back_populates="attendance_records")
    course = relationship("Course", back_populates="attendance_records")

class CampusRequest(Base):
    __tablename__ = "campus_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False)
    request_type = Column(String, nullable=False) # e.g., 'leave', 'transcript'
    status = Column(String, default="pending") # pending, approved, rejected, completed, failed
    description = Column(String)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)
    
    student = relationship("Student", back_populates="requests")
    traces = relationship("DecisionTrace", back_populates="request")

class DecisionTrace(Base):
    __tablename__ = "decision_traces"
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("campus_requests.id"), nullable=True)
    step_number = Column(Integer, nullable=False)
    event_type = Column(String, nullable=False) # GOAL_RECEIVED, TOOL_STARTED, etc.
    component = Column(String, nullable=False) # orchestrator, planner, tool_registry
    action = Column(String, nullable=False)
    input_data = Column(String) # JSON string
    output_data = Column(String) # JSON string
    status = Column(String, nullable=False) # success, failure, pending
    error_message = Column(String)
    timestamp = Column(DateTime, default=get_utc_now)

    request = relationship("CampusRequest", back_populates="traces")

class AgentStateModel(Base):
    __tablename__ = "agent_states"
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("campus_requests.id"), unique=True, nullable=False)
    state_data = Column(String, nullable=False) # JSON string
    
    request = relationship("CampusRequest")
