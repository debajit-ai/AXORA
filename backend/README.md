# AXORA - Backend

This is the backend for AXORA (Adaptive eXecution & Orchestration for Responsive Assistance). It provides the core APIs and tool abstractions used by the AXORA agentic system.

## Architecture

The backend follows a modular, production-ready structure:
- `app/api/`: FastAPI routes and endpoints
- `app/core/`: Application settings and configuration (Pydantic Settings)
- `app/db/`: SQLAlchemy database setup and ORM models
- `app/schemas/`: Pydantic models for request and response validation
- `app/services/`: Core business logic interacting with the database
- `app/tools/`: The **Tool Abstraction Layer**, where individual campus tools are defined for the agent.

## Why a Tool Abstraction?

Unlike standard conversational chatbots, AXORA is designed as an agentic system. The agent doesn't directly call internal Python services. Instead, it interacts through a **Tool Registry**. Each tool explicitly defines its metadata, input schemas, and whether it requires human approval. This allows an LLM planner to dynamically discover and compose actions.

## Setup & Running

1. **Create a virtual environment:**
   ```bash
   python -m venv venv
   .\venv\Scripts\Activate.ps1   # Windows
   source venv/bin/activate      # Linux/Mac
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment:**
   Copy `.env.example` to `.env` and set your database URL and settings.

4. **Run the server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

## API Endpoints

- **GET `/api/health`** - System health check
- **GET `/api/students`** - List all students (for demo)
- **GET `/api/students/{id}`** - Get student details
- **GET `/api/tools`** - Get metadata for all registered tools
- **GET `/api/traces/{request_id}`** - Retrieve execution traces for the future Agentic Trace Viewer

## Testing

Run tests with `pytest`:
```bash
pytest tests/
```
