from fastapi import APIRouter
from app.api.routes import health, students, tools, traces, agent

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(tools.router, prefix="/tools", tags=["tools"])
api_router.include_router(traces.router, prefix="/traces", tags=["traces"])
api_router.include_router(agent.router, prefix="/agent", tags=["agent"])
