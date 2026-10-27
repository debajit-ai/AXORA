from app.agent.state import Task
from app.tools.registry import registry

class ToolSelector:
    def select_tool(self, task: Task) -> str:
        for tool_name in task.candidate_tools:
            tool = registry.get_tool(tool_name)
            if tool:
                return tool_name
        raise ValueError(f"No valid tool found for task {task.task_id}")
