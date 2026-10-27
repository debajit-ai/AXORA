from pydantic import BaseModel, EmailStr, ConfigDict
from typing import List, Optional

class AttendanceRecordBase(BaseModel):
    course_id: int
    attended_classes: int
    total_classes: int

class AttendanceRecordResponse(AttendanceRecordBase):
    id: int
    student_id: str

    model_config = ConfigDict(from_attributes=True)

class StudentBase(BaseModel):
    student_id: str
    name: str
    email: EmailStr
    program: str
    semester: int

class StudentResponse(StudentBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class CourseResponse(BaseModel):
    id: int
    course_code: str
    course_name: str
    faculty: str

    model_config = ConfigDict(from_attributes=True)
