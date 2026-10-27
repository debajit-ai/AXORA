from typing import Dict, Any
from app.schemas.tool import ToolSchema

class BaseTool:
    name: str = ""
    description: str = ""
    category: str = ""
    input_schema: Dict[str, Any] = {}
    requires_human_approval: bool = False

    def to_schema(self) -> ToolSchema:
        return ToolSchema(
            name=self.name,
            description=self.description,
            category=self.category,
            input_schema=self.input_schema,
            requires_human_approval=self.requires_human_approval
        )

    def execute(self, **kwargs) -> Any:
        raise NotImplementedError("Tool must implement execute method")
