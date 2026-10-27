from fastapi import APIRouter, HTTPException
from typing import List
from app.tools.registry import registry
from app.schemas.tool import ToolSchema

router = APIRouter()

@router.get("/", response_model=List[ToolSchema])
def list_tools():
    return [tool.to_schema() for tool in registry.list_tools()]

@router.get("/{tool_name}", response_model=ToolSchema)
def get_tool(tool_name: str):
    tool = registry.get_tool(tool_name)
    if not tool:
         raise HTTPException(status_code=404, detail={"code": "TOOL_NOT_FOUND", "message": "Tool was not found"})
    return tool.to_schema()
