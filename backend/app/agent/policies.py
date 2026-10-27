from app.tools.registry import registry

class PolicyEngine:
    def validate_tool_execution(self, tool_name: str) -> bool:
        tool = registry.get_tool(tool_name)
        if not tool:
            return False
        return True
