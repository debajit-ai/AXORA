import re
from typing import Optional
from app.agent.goal import Goal

class GoalNormalizer:
    def normalize(self, student_id: str, goal_text: str) -> Goal:
        text = goal_text.strip()
        text_lower = text.lower()
        
        # 1. Goal type detection (Campus services)
        if any(kw in text_lower for kw in ["leave", "absence", "sick", "vacation", "holiday", "permission"]) or "failure_mode" in text_lower:
            goal_type = "LEAVE_APPLICATION"
        else:
            goal_type = "LEAVE_APPLICATION"  # Default workflow in Phase 3
            
        parameters = {}
        
        # 2. Failure simulation detection
        failure_match = re.search(r"failure_mode=([a-zA-Z0-9_]+)", text, re.IGNORECASE)
        if failure_match:
            parameters["failure_mode"] = failure_match.group(1).lower()
        
        # 3. Days extraction
        days_match = re.search(r"(\d+)\s*(?:day|days)", text_lower)
        if days_match:
            parameters["days"] = int(days_match.group(1))
        else:
            parameters["days"] = 1
            
        # 4. Reason extraction
        if "family function" in text_lower:
            parameters["reason"] = "family function"
        elif "medical" in text_lower or "fever" in text_lower or "sick" in text_lower:
            parameters["reason"] = "medical reasons"
        else:
            reason_match = re.search(r"(?:because|due to|reason\s*[:=]|for reason)\s+([^.,;]+)", text_lower)
            if reason_match:
                extracted = reason_match.group(1).strip()
                # Clean up leading phrases like "i have a"
                extracted = re.sub(r"^(?:i\s+have\s+a|i\s+have|a)\s+", "", extracted).strip()
                parameters["reason"] = extracted
            elif "failure_mode" in text_lower:
                parameters["reason"] = "simulated diagnostic test"
            else:
                parameters["reason"] = "personal leave"
                
        return Goal(
            goal_type=goal_type,
            student_id=student_id,
            parameters=parameters,
            constraints=[]
        )
