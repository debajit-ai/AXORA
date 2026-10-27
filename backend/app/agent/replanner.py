from app.agent.state import AgentState

class Replanner:
    MAX_REPLANS = 3
    
    def can_replan(self, state: AgentState) -> bool:
        return state.replanning_count < self.MAX_REPLANS
        
    def replan(self, state: AgentState, failed_task_id: str):
        state.replanning_count += 1
        if failed_task_id not in state.pending_tasks:
            state.pending_tasks.insert(0, failed_task_id)
        
        for t in state.plan:
            if t.task_id == failed_task_id:
                t.status = "PENDING"
