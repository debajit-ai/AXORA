from app.tools.registry import registry
from app.tools.campus_tools import (
    GetStudentProfileTool,
    GetAttendanceTool,
    GetCourseScheduleTool,
    GetLeavePolicyTool,
    CheckLeaveEligibilityTool,
    CreateLeaveApplicationTool,
    GetLeaveApplicationStatusTool
)

def register_all_tools():
    registry.register(GetStudentProfileTool())
    registry.register(GetAttendanceTool())
    registry.register(GetCourseScheduleTool())
    registry.register(GetLeavePolicyTool())
    registry.register(CheckLeaveEligibilityTool())
    registry.register(CreateLeaveApplicationTool())
    registry.register(GetLeaveApplicationStatusTool())

register_all_tools()
