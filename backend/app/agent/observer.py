from typing import Any

class ObservationResult:
    SUCCESS = "SUCCESS"
    RECOVERABLE_FAILURE = "RECOVERABLE_FAILURE"
    NON_RECOVERABLE_FAILURE = "NON_RECOVERABLE_FAILURE"
    REQUIRES_HUMAN = "REQUIRES_HUMAN"
    INVALID_RESULT = "INVALID_RESULT"

class Observer:
    def observe(self, tool_name: str, result: Any) -> str:
        if isinstance(result, dict):
            # Check for business logic eligibility failure (e.g., check_leave_eligibility)
            if result.get("eligible") is False:
                return ObservationResult.NON_RECOVERABLE_FAILURE
            
            # Check for errors in tool execution
            if "error" in result:
                err_msg = str(result["error"]).lower()
                if "timeout" in err_msg or "temporary" in err_msg or "transient" in err_msg:
                    return ObservationResult.RECOVERABLE_FAILURE
                return ObservationResult.NON_RECOVERABLE_FAILURE
                
        return ObservationResult.SUCCESS
