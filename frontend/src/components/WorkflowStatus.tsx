"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Layers,
  ShieldAlert,
  Wrench,
  XCircle,
} from "lucide-react";
import { AgentResult, AgentState, Task } from "../types/api";

interface WorkflowStatusProps {
  state: AgentState | null;
  result: AgentResult | null;
  tasks: Task[];
}

export function WorkflowStatus({ state, result, tasks }: WorkflowStatusProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  if (!state && !result && tasks.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-8 border border-white/[0.08] text-center">
        <div className="p-3 w-12 h-12 rounded-full bg-white/[0.04] text-slate-300 mx-auto mb-3 flex items-center justify-center">
          <Layers className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-white">No Active Workflow</h3>
        <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
          Dispatch a campus service goal above to observe the planner, autonomous tool execution, and topological task progression.
        </p>
      </div>
    );
  }

  const planTasks = state?.plan && state.plan.length > 0 ? state.plan : tasks;
  const completedSet = new Set(state?.completed_tasks || result?.completed_tasks || []);
  const failedSet = new Set(state?.failed_tasks || result?.failed_tasks || []);
  const pendingSet = new Set(state?.pending_tasks || []);
  const toolResults = state?.tool_results || {};
  const selectedTools = state?.selected_tools || {};

  const getTaskVisualState = (task: Task) => {
    if (completedSet.has(task.task_id)) return "COMPLETED";
    if (failedSet.has(task.task_id)) return "FAILED";
    if (state?.current_status === "WAITING_FOR_HUMAN" && task.requires_human_approval && pendingSet.has(task.task_id)) {
      return "WAITING_FOR_HUMAN";
    }
    if (state?.current_status === "EXECUTING" && pendingSet.has(task.task_id) && state.pending_tasks[0] === task.task_id) {
      return "EXECUTING";
    }
    return "PENDING";
  };

  return (
    <div className="glass-panel rounded-xl p-5 border border-white/[0.08]">
      {/* Workflow Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
                Plan Execution Pipeline
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-300">
                Topologically Sorted
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Autonomous execution loop respecting task dependency graph
            </p>
          </div>
        </div>

        {/* Normalized Goal Info */}
        {state?.normalized_goal && (
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-300">GOAL TYPE:</span>
            <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold">
              {state.normalized_goal.goal_type}
            </span>
            {Boolean(state.normalized_goal.parameters?.days) && (
              <span className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-slate-300">
                {String(state.normalized_goal.parameters.days)} day(s)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Final message alert if completed or failed */}
      {result?.final_message && (
        <div
          className={`mt-4 p-3 rounded-lg text-xs font-mono border flex items-start space-x-2.5 ${
            result.status === "COMPLETED"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : result.status === "FAILED"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
              : "bg-amber-500/10 border-amber-500/30 text-amber-300"
          }`}
        >
          {result.status === "COMPLETED" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : result.status === "FAILED" ? (
            <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-semibold block uppercase tracking-wider text-[10px]">
              Final Status Message
            </span>
            <p className="mt-0.5 text-xs">{result.final_message}</p>
          </div>
        </div>
      )}

      {/* Task DAG Cards */}
      <div className="mt-4 space-y-2.5">
        {planTasks.map((task, idx) => {
          const visualState = getTaskVisualState(task);
          const isExpanded = expandedTask === task.task_id;
          const assignedTool = selectedTools[task.task_id] || task.candidate_tools[0];
          const taskResult = toolResults[task.task_id];

          return (
            <div
              key={task.task_id}
              className={`rounded-lg border transition-all ${
                visualState === "COMPLETED"
                  ? "bg-emerald-950/15 border-emerald-500/30"
                  : visualState === "EXECUTING"
                  ? "bg-blue-950/25 border-blue-500/60 shadow-md shadow-blue-500/10"
                  : visualState === "WAITING_FOR_HUMAN"
                  ? "bg-amber-950/25 border-amber-500/60 shadow-md shadow-amber-500/10"
                  : visualState === "FAILED"
                  ? "bg-rose-950/20 border-rose-500/40"
                  : "bg-white/[0.02] border-white/[0.06]"
              }`}
            >
              <div
                onClick={() => setExpandedTask(isExpanded ? null : task.task_id)}
                className="p-3.5 flex items-center justify-between cursor-pointer select-none"
              >
                {/* Left: Index, Icon, Description */}
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded bg-white/[0.05] text-[11px] font-mono text-slate-300 font-semibold shrink-0">
                    {idx + 1}
                  </div>

                  {visualState === "COMPLETED" && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  )}
                  {visualState === "EXECUTING" && (
                    <div className="h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin shrink-0" />
                  )}
                  {visualState === "WAITING_FOR_HUMAN" && (
                    <ShieldAlert className="h-4 w-4 text-amber-400 animate-pulse shrink-0" />
                  )}
                  {visualState === "FAILED" && (
                    <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  )}
                  {visualState === "PENDING" && (
                    <Clock className="h-4 w-4 text-slate-300 shrink-0" />
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-semibold text-white">
                        {task.task_id}
                      </span>
                      <span className="text-xs text-slate-200 truncate">{task.description}</span>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex items-center space-x-2 mt-1 text-[10px] font-mono text-slate-300">
                      {assignedTool && (
                        <span className="flex items-center space-x-1 text-indigo-300">
                          <Wrench className="h-3 w-3" />
                          <span>{assignedTool}</span>
                        </span>
                      )}
                      {task.dependencies.length > 0 && (
                        <span className="text-slate-300">
                          deps: [{task.dependencies.join(", ")}]
                        </span>
                      )}
                      {task.requires_human_approval && (
                        <span className="text-amber-400 font-semibold">
                          Requires Approval
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Status Pill & Expand Caret */}
                <div className="flex items-center space-x-2 shrink-0">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                      visualState === "COMPLETED"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : visualState === "EXECUTING"
                        ? "bg-blue-500/20 text-blue-300 animate-pulse"
                        : visualState === "WAITING_FOR_HUMAN"
                        ? "bg-amber-500/20 text-amber-300 font-semibold"
                        : visualState === "FAILED"
                        ? "bg-rose-500/20 text-rose-300"
                        : "bg-white/[0.05] text-slate-300"
                    }`}
                  >
                    {visualState}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-300" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  )}
                </div>
              </div>

              {/* Collapsible details / tool result payload */}
              {isExpanded && (
                <div className="px-4 pb-3 pt-1 border-t border-white/[0.06] text-xs font-mono space-y-2 bg-black/20">
                  <div className="flex items-center justify-between text-slate-300 text-[11px]">
                    <span>CANDIDATE TOOLS: {task.candidate_tools.join(", ")}</span>
                    <span>HUMAN APPROVAL GATE: {task.requires_human_approval ? "YES" : "NO"}</span>
                  </div>

                  {taskResult ? (
                    <div>
                      <span className="text-slate-300 text-[10px] uppercase block mb-1">
                        Execution Result Payload:
                      </span>
                      <pre className="p-2.5 rounded bg-[#090b12] border border-white/[0.06] text-[11px] text-emerald-300 overflow-x-auto">
                        {JSON.stringify(taskResult, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-300 italic">
                      {visualState === "PENDING"
                        ? "Awaiting execution in dependency sequence."
                        : "No payload recorded yet."}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
