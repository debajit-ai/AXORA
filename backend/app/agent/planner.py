from collections import deque
from typing import List, Dict
from app.agent.state import Task, AgentState

class Planner:
    def create_plan(self, tasks: List[Task], state: AgentState) -> List[Task]:
        """
        Generates an executable plan respecting task dependencies via topological ordering.
        Validates dependency integrity and guards against cyclic dependencies.
        """
        if not tasks:
            state.plan = []
            state.pending_tasks = []
            return []

        task_map: Dict[str, Task] = {t.task_id: t for t in tasks}

        # 1. Validate that all dependencies exist in the task set
        for task in tasks:
            for dep in task.dependencies:
                if dep not in task_map:
                    raise ValueError(f"Task '{task.task_id}' depends on non-existent task '{dep}'")

        # 2. Build dependency graph (in-degrees and dependents)
        in_degree: Dict[str, int] = {t.task_id: len(t.dependencies) for t in tasks}
        dependents: Dict[str, List[str]] = {t.task_id: [] for t in tasks}
        for task in tasks:
            for dep in task.dependencies:
                dependents[dep].append(task.task_id)

        # 3. Topological sort using Kahn's algorithm while preserving original relative order
        queue = deque([t.task_id for t in tasks if in_degree[t.task_id] == 0])
        sorted_task_ids: List[str] = []

        while queue:
            current_id = queue.popleft()
            sorted_task_ids.append(current_id)
            for dep_id in dependents[current_id]:
                in_degree[dep_id] -= 1
                if in_degree[dep_id] == 0:
                    queue.append(dep_id)

        if len(sorted_task_ids) != len(tasks):
            raise ValueError("Circular dependency detected among tasks")

        sorted_tasks = [task_map[tid] for tid in sorted_task_ids]
        state.plan = sorted_tasks
        state.pending_tasks = [t.task_id for t in sorted_tasks]
        return sorted_tasks
