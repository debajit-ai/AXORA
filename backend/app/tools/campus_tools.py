from typing import Dict, Any
from sqlalchemy.orm import Session
from app.tools.base import BaseTool
from app.services import student_service

class GetStudentProfileTool(BaseTool):
    name = "get_student_profile"
    description = "Get basic profile information for a student"
    category = "student_records"
    input_schema = {
        "type": "object",
        "properties": {
            "student_id": {"type": "string"}
        },
        "required": ["student_id"]
    }
    requires_human_approval = False

    def execute(self, db: Session, student_id: str) -> Any:
        student = student_service.get_student_by_id(db, student_id)
        if not student:
            return {"error": "Student not found"}
        return {
            "student_id": student.student_id,
            "name": student.name,
            "email": student.email,
            "program": student.program,
            "semester": student.semester
        }

class GetAttendanceTool(BaseTool):
    name = "get_attendance"
    description = "Get attendance records for a student"
    category = "academic"
    input_schema = {
        "type": "object",
        "properties": {
            "student_id": {"type": "string"}
        },
        "required": ["student_id"]
    }
    requires_human_approval = False

    def execute(self, db: Session, student_id: str) -> Any:
        records = student_service.get_student_attendance(db, student_id)
        if not records:
             return {"error": "No attendance records found or student not found"}
        return [{"course_id": r.course_id, "attended": r.attended_classes, "total": r.total_classes} for r in records]

class GetCourseScheduleTool(BaseTool):
    name = "get_course_schedule"
    description = "Get course schedule for a student"
    category = "academic"
    input_schema = {
        "type": "object",
        "properties": {
            "student_id": {"type": "string"}
        },
        "required": ["student_id"]
    }
    requires_human_approval = False

    def execute(self, db: Session, student_id: str) -> Any:
        courses = student_service.get_student_courses(db, student_id)
        return [{"course_code": c.course_code, "course_name": c.course_name, "faculty": c.faculty} for c in courses]

class GetLeavePolicyTool(BaseTool):
    name = "get_leave_policy"
    description = "Get campus leave policy"
    category = "policy"
    input_schema = {
        "type": "object",
        "properties": {}
    }
    requires_human_approval = False

    def execute(self, **kwargs) -> Any:
        return {"policy": "Students must have >75% attendance. Leaves require HOD approval if >3 days."}

class CheckLeaveEligibilityTool(BaseTool):
    name = "check_leave_eligibility"
    description = "Check if student is eligible for leave"
    category = "leave"
    input_schema = {
        "type": "object",
        "properties": {
            "student_id": {"type": "string"}
        },
        "required": ["student_id"]
    }
    requires_human_approval = False

    def execute(self, db: Session, student_id: str) -> Any:
        records = student_service.get_student_attendance(db, student_id)
        if not records:
             return {"eligible": False, "reason": "No attendance data"}
        total_attended = sum(r.attended_classes for r in records)
        total_classes = sum(r.total_classes for r in records)
        if total_classes == 0:
            return {"eligible": True, "reason": "No classes held yet"}
        percentage = (total_attended / total_classes) * 100
        if percentage < 75:
             return {"eligible": False, "reason": f"Attendance is {percentage:.2f}%, which is below 75%"}
        return {"eligible": True, "reason": f"Attendance is {percentage:.2f}%"}

class CreateLeaveApplicationTool(BaseTool):
    name = "create_leave_application"
    description = "Create a leave application for a student"
    category = "leave"
    input_schema = {
        "type": "object",
        "properties": {
            "student_id": {"type": "string"},
            "reason": {"type": "string"},
            "days": {"type": "integer"}
        },
        "required": ["student_id", "reason", "days"]
    }
    requires_human_approval = True

    def execute(self, db: Session, student_id: str, reason: str, days: int) -> Any:
        return {"status": "created", "message": "Leave application submitted and awaiting approval"}

class GetLeaveApplicationStatusTool(BaseTool):
    name = "get_leave_application_status"
    description = "Get status of a leave application"
    category = "leave"
    input_schema = {
        "type": "object",
        "properties": {
            "student_id": {"type": "string"}
        },
        "required": ["student_id"]
    }
    requires_human_approval = False

    def execute(self, db: Session, student_id: str) -> Any:
        return {"status": "pending", "message": "Your recent leave application is pending approval"}
