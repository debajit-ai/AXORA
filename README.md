# Project 55 — Agentic AI Assistant for Multi-Step Campus Service Workflows

## Project Purpose
Project 55 aims to build a genuinely **agentic** campus service assistant. Unlike traditional chatbots that use simple intent-matching or rigid dialogue trees, this system operates autonomously to solve multi-step campus service workflows. It is capable of goal decomposition, tool selection, failure detection, dynamic replanning, and deferring to human approval for consequential actions.

## Problem Definition
University campuses involve complex, multi-step administrative workflows (e.g., applying for leave, booking lab slots, raising maintenance requests). Current solutions are either disjointed web portals or simplistic chatbots that cannot navigate unexpected failures. Project 55 solves this by introducing a reasoning-capable agent that interacts with (simulated) campus APIs and handles edge cases autonomously.

## Agentic Architecture
The system is divided into clear functional boundaries:
- **Agent Orchestration**: Powered by Langchain/Python, responsible for planning, executing tools, and evaluating outcomes.
- **Simulated Campus Tools**: A suite of isolated tools (e.g., `get_attendance`, `submit_leave_application`) mimicking real university systems.
- **Frontend Console**: An AI Operations Dashboard built in Next.js to trace the agent's thought process, approve consequential actions, and view execution metrics.
- **Evaluation Engine**: A separate module to benchmark the agent against a rigid, rule-based baseline.

## Technology Stack
- **Backend**: Python, FastAPI, SQLAlchemy, SQLite (with Pydantic for strict typing).
- **Agent Layer**: Langchain/Custom Orchestration, LLM agnostic (Ollama for local development, easily swappable).
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS.
- **Evaluation**: Custom metric tracking (Task completion rate, replanning events, failure recovery).

## Development Roadmap
1. **Phase 1: Project Scaffolding** - Setting up the monorepo architecture, FastAPI backend, and Next.js frontend (Completed).
2. **Phase 2: Core Tool Development** - Implementing simulated campus services (e.g., Leave Application flow) with intentional failure points.
3. **Phase 3: Agent Orchestration** - Building the agent's reasoning loop (Plan, Execute, Observe, Replan).
4. **Phase 4: Human-in-the-loop** - Implementing the approval mechanism for consequential actions.
5. **Phase 5: Operations Console UI** - Visualizing the decision trace and metrics on the frontend dashboard.
6. **Phase 6: Evaluation & Benchmarking** - Comparing the agent's performance to the rule-based baseline.

## Running the Application

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
