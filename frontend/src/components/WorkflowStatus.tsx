"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  GitBranch,
  Layers,
  RotateCcw,
  ShieldAlert,
  Wrench,
  XCircle,
} from "lucide-react";
import { AgentResult, AgentState, Task } from "../types/api";

interface WorkflowStatusProps {
  state: AgentState | null;
  result: AgentResult | null;
  tasks: Task[];
  onInspectToolInTrace?: (toolName: string) => void;
}

export function WorkflowStatus({
  state,
  result,
  tasks,
  onInspectToolInTrace,
}: WorkflowStatusProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  if (!state && !result && tasks.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-8 text-center h-full flex flex-col items-center justify-center">
        <div className="p-3.5 w-14 h-14 rounded-xl bg-[#0E1217] border border-[#1E242C] text-[#39FF14] mx-auto mb-4 flex items-center justify-center shadow-inner">
          <Layers className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-[#F2F4F7] tracking-wide uppercase">
          No Active <span className="text-[#39FF14]">Workflow</span>
        </h3>
        <p className="text-xs text-[#F2F4F7]/85 mt-1.5 max-w-md mx-auto leading-relaxed">
          Dispatch a campus service goal from the composer to observe deterministic goal normalization, topological dependency planning, autonomous tool orchestration, and human governance gates.
        </p>

        {/* Architecture Preview Pipeline */}
        <div className="mt-6 pt-5 border-t border-[#1E242C] w-full max-w-lg">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#F2F4F7] block mb-2.5">
            AUTONOMOUS EXECUTION <span className="text-[#39FF14]">ARCHITECTURE</span>
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[10px] font-mono">
            {[
              "1. Normalize",
              "2. Decompose",
              "3. Plan DAG",
              "4. Execute",
              "5. Observe",
              "6. Govern",
            ].map((step) => (
              <div
                key={step}
                className="px-2 py-1.5 rounded bg-[#0E1217] border border-[#1E242C] text-[#F2F4F7] truncate"
              >
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const planTasks = state?.plan && state.plan.length > 0 ? state.plan : tasks;
  const completedSet = new Set(state?.completed_tasks || result?.completed_tasks || []);
  const failedSet = new Set(state?.failed_tasks || result?.failed_tasks || []);
  const pendingSet = new Set(state?.pending_tasks || []);
  const toolResults = state?.tool_results || {};
  const selectedTools = state?.selected_tools || {};
  const observations = state?.observations || [];
  const workflowStatus = state?.current_status || result?.status || "IDLE";
  const finalMessage =
    result?.final_message ||
    state?.final_result ||
    state?.error ||
    (workflowStatus === "WAITING_FOR_HUMAN" ? "Waiting for human approval" : null);

  const getTaskVisualState = (task: Task) => {
    if (completedSet.has(task.task_id)) return "COMPLETED";
    if (failedSet.has(task.task_id)) return "FAILED";
    if (
      workflowStatus === "WAITING_FOR_HUMAN" &&
      task.requires_human_approval &&
      pendingSet.has(task.task_id)
    ) {
      return "WAITING_FOR_HUMAN";
    }
    if (
      workflowStatus === "EXECUTING" &&
      pendingSet.has(task.task_id) &&
      state?.pending_tasks[0] === task.task_id
    ) {
      return "EXECUTING";
    }
    return "PENDING";
  };

  return (
    <div className="glass-panel rounded-xl p-5">
      {/* Workflow Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1E242C]">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-[#0E1217] border border-[#39FF14]/35 text-[#39FF14]">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold tracking-wide text-[#F2F4F7] uppercase">
                Plan <span className="text-[#39FF14]">Execution</span> Pipeline
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0E1217] border border-[#1E242C] text-[#F2F4F7]">
                Topologically Sorted
              </span>
            </div>
            <p className="text-xs text-[#F2F4F7]/85">
              Autonomous execution loop respecting task dependency graph
            </p>
          </div>
        </div>

        {/* Normalized Goal Info */}
        {state?.normalized_goal && (
          <div className="flex items-center flex-wrap gap-1.5 text-xs font-mono">
            <span className="text-[#8A94A6] text-[11px]">GOAL TYPE:</span>
            <span className="px-2 py-0.5 rounded bg-[#685BFF]/15 border border-[#685BFF]/40 text-[#F2F4F7] font-semibold">
              {state.normalized_goal.goal_type}
            </span>
            {Boolean(state.normalized_goal.parameters?.days) && (
              <span className="px-2 py-0.5 rounded bg-[#0E1217] border border-[#1E242C] text-[#64A7FF]">
                {String(state.normalized_goal.parameters.days)} day(s)
              </span>
            )}
            {Boolean(state.normalized_goal.parameters?.reason) && (
              <span className="px-2 py-0.5 rounded bg-[#0E1217] border border-[#1E242C] text-[#F2F4F7] max-w-[180px] truncate">
                {String(state.normalized_goal.parameters.reason)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Final message alert if completed, waiting, or failed */}
      {finalMessage && (
        <div
          className={`mt-4 p-3.5 rounded-lg text-xs font-mono border flex items-start justify-between gap-3 ${
            workflowStatus === "COMPLETED"
              ? "bg-[#20C997]/10 border-[#20C997]/35 text-[#20C997]"
              : workflowStatus === "FAILED"
              ? "bg-[#F16D78]/10 border-[#F16D78]/35 text-[#F16D78]"
              : "bg-[#F2B84B]/10 border-[#F2B84B]/35 text-[#F2B84B]"
          }`}
        >
          <div className="flex items-start space-x-2.5 min-w-0">
            {workflowStatus === "COMPLETED" ? (
              <CheckCircle2 className="h-4 w-4 text-[#20C997] shrink-0 mt-0.5" />
            ) : workflowStatus === "FAILED" ? (
              <XCircle className="h-4 w-4 text-[#F16D78] shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-[#F2B84B] shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <span className="font-semibold block uppercase tracking-wider text-[10px]">
                Final Status Message
              </span>
              <p className="mt-0.5 text-xs text-[#F1F4FA] break-words">{finalMessage}</p>
            </div>
          </div>

          {result?.execution_time !== undefined && result.execution_time > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#000000]/70 border border-[#1E2E24] text-[#98A3B6] shrink-0">
              {result.execution_time}s
            </span>
          )}
        </div>
      )}

      {/* Task DAG Cards */}
      <div className="mt-4 space-y-2.5">
        {planTasks.map((task, idx) => {
          const visualState = getTaskVisualState(task);
          const isExpanded = expandedTask === task.task_id;
          const assignedTool = selectedTools[task.task_id] || task.candidate_tools[0];
          const taskResult = toolResults[task.task_id];
          const taskObservations = observations.filter((o) => o.task_id === task.task_id);
          const hadRecoverableFailure = taskObservations.some(
            (o) => o.observation === "RECOVERABLE_FAILURE"
          );
          const isBlockedByUpstreamFailure =
            workflowStatus === "FAILED" && visualState === "PENDING";

          return (
            <div
              key={task.task_id}
              className={`rounded-lg border transition-all ${
                visualState === "COMPLETED"
                  ? "bg-[#20C997]/[0.05] border-[#20C997]/30"
                  : visualState === "EXECUTING"
                  ? "bg-[#64A7FF]/[0.08] border-[#64A7FF]/60 shadow-[0_0_20px_-6px_rgba(100,167,255,0.25)]"
                  : visualState === "WAITING_FOR_HUMAN"
                  ? "bg-[#F2B84B]/[0.08] border-[#F2B84B]/60 shadow-[0_0_20px_-6px_rgba(242,184,75,0.25)]"
                  : visualState === "FAILED"
                  ? "bg-[#F16D78]/[0.07] border-[#F16D78]/45"
                  : "bg-[#090B0E] border-[#1E242C]"
              }`}
            >
              <div
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                onClick={() => setExpandedTask(isExpanded ? null : task.task_id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setExpandedTask(isExpanded ? null : task.task_id);
                  }
                }}
                className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                {/* Left: Index, Icon, Description & Metadata */}
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded bg-[#000000] border border-[#1E242C] text-[11px] font-mono text-[#F2F4F7] font-semibold shrink-0">
                    {idx + 1}
                  </div>

                  {visualState === "COMPLETED" && (
                    <CheckCircle2 className="h-4 w-4 text-[#20C997] shrink-0" />
                  )}
                  {visualState === "EXECUTING" && (
                    <div className="h-4 w-4 rounded-full border-2 border-[#64A7FF] border-t-transparent animate-spin shrink-0" />
                  )}
                  {visualState === "WAITING_FOR_HUMAN" && (
                    <ShieldAlert className="h-4 w-4 text-[#F2B84B] animate-pulse shrink-0" />
                  )}
                  {visualState === "FAILED" && (
                    <XCircle className="h-4 w-4 text-[#F16D78] shrink-0" />
                  )}
                  {visualState === "PENDING" && (
                    <Clock className="h-4 w-4 text-[#8A94A6] shrink-0" />
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-mono text-xs font-semibold text-[#F2F4F7] px-1.5 py-0.2 rounded bg-[#000000] border border-[#1E242C]">
                        {task.task_id}
                      </span>
                      <span className="text-xs font-medium text-[#F2F4F7] truncate">
                        {task.description}
                      </span>
                      {hadRecoverableFailure && visualState === "COMPLETED" && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#685BFF]/20 border border-[#685BFF]/45 text-[#64A7FF]">
                          <RotateCcw className="h-2.5 w-2.5" />
                          <span>Self-Healed</span>
                        </span>
                      )}
                      {hadRecoverableFailure && visualState === "FAILED" && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F16D78]/15 border border-[#F16D78]/35 text-[#F16D78]">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          <span>Retries Exhausted ({taskObservations.length} attempts)</span>
                        </span>
                      )}
                    </div>

                    {/* Metadata tags */}
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[10px] font-mono text-[#98A3B6]">
                      {assignedTool && (
                        <span className="flex items-center space-x-1 text-[#64A7FF]">
                          <Wrench className="h-3 w-3" />
                          <span>{assignedTool}</span>
                        </span>
                      )}
                      {task.dependencies.length > 0 ? (
                        <span className="flex items-center space-x-1 text-[#98A3B6]">
                          <GitBranch className="h-3 w-3" />
                          <span>deps: [{task.dependencies.join(", ")}]</span>
                        </span>
                      ) : (
                        <span className="text-[#98A3B6]/70">root node</span>
                      )}
                      {task.requires_human_approval && (
                        <span className="text-[#F2B84B] font-semibold">
                          Requires Approval
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Status Pill & Expand Caret */}
                <div className="flex items-center space-x-2 shrink-0">
                  {isBlockedByUpstreamFailure && (
                    <span className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#000000] border border-[#1E2E24] text-[#98A3B6]">
                      HALTED UPSTREAM
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium border ${
                      visualState === "COMPLETED"
                        ? "bg-[#20C997]/15 border-[#20C997]/35 text-[#20C997]"
                        : visualState === "EXECUTING"
                        ? "bg-[#64A7FF]/15 border-[#64A7FF]/40 text-[#64A7FF] animate-pulse"
                        : visualState === "WAITING_FOR_HUMAN"
                        ? "bg-[#F2B84B]/15 border-[#F2B84B]/40 text-[#F2B84B] font-semibold"
                        : visualState === "FAILED"
                        ? "bg-[#F16D78]/15 border-[#F16D78]/40 text-[#F16D78]"
                        : "bg-[#000000] border-[#1E2E24] text-[#98A3B6]"
                    }`}
                  >
                    {visualState}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-[#98A3B6]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[#98A3B6]" />
                  )}
                </div>
              </div>

              {/* Collapsible details / tool result payload */}
              {isExpanded && (
                <div className="px-4 pb-3.5 pt-2.5 border-t border-[#1E2E24] text-xs font-mono space-y-2.5 bg-[#000000]/80 rounded-b-lg">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[#98A3B6] text-[11px]">
                    <span>CANDIDATE TOOLS: {task.candidate_tools.join(", ")}</span>
                    <div className="flex items-center space-x-3">
                      <span>
                        HUMAN APPROVAL GATE: {task.requires_human_approval ? "YES" : "NO"}
                      </span>
                      {assignedTool && onInspectToolInTrace && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectToolInTrace(assignedTool);
                          }}
                          className="inline-flex items-center space-x-1 text-[#64A7FF] hover:text-[#F1F4FA] transition cursor-pointer"
                        >
                          <span>Inspect in Trace</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Observation History for this task */}
                  {taskObservations.length > 0 && (
                    <div className="flex items-center flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] text-[#98A3B6] uppercase">
                        OBSERVER OUTCOMES:
                      </span>
                      {taskObservations.map((obs, oIdx) => (
                        <span
                          key={oIdx}
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            obs.observation === "SUCCESS"
                              ? "bg-[#20C997]/12 border-[#20C997]/30 text-[#20C997]"
                              : obs.observation === "RECOVERABLE_FAILURE"
                              ? "bg-[#685BFF]/15 border-[#685BFF]/40 text-[#64A7FF]"
                              : "bg-[#F16D78]/12 border-[#F16D78]/35 text-[#F16D78]"
                          }`}
                        >
                          Attempt #{oIdx + 1}: {obs.observation}
                        </span>
                      ))}
                    </div>
                  )}

                  {taskResult ? (
                    <div>
                      <span className="text-[#98A3B6] text-[10px] uppercase block mb-1">
                        Execution Result Payload:
                      </span>
                      <pre className="p-2.5 rounded bg-[#000000] border border-[#1E2E24] text-[11px] text-[#20C997] overflow-x-auto">
                        {JSON.stringify(taskResult, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#98A3B6] italic">
                      {isBlockedByUpstreamFailure
                        ? "Execution skipped — workflow terminated due to an upstream failure or rejection."
                        : visualState === "PENDING"
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
