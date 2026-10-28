"use client";

import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  Wrench,
  Zap,
} from "lucide-react";
import {
  AgentResult,
  AgentState,
  ToolSchema,
  WorkflowSessionSummary,
  WorkflowStatus,
  WorkspaceSection,
} from "../types/api";

interface OverviewDashboardProps {
  state: AgentState | null;
  result: AgentResult | null;
  tools: ToolSchema[];
  recentRequestIds: number[];
  activeRequestId: number | null;
  onSelectRequestId: (id: number) => void;
  isLoading: boolean;
  sessionSummaries?: Record<number, WorkflowSessionSummary>;
  onRefreshActiveRequest?: () => void;
  onNavigateToSection?: (section: WorkspaceSection) => void;
  onFocusComposer?: () => void;
}

export function OverviewDashboard({
  state,
  result,
  tools,
  recentRequestIds,
  activeRequestId,
  onSelectRequestId,
  isLoading,
  sessionSummaries = {},
  onRefreshActiveRequest,
  onNavigateToSection,
  onFocusComposer,
}: OverviewDashboardProps) {
  const [lookupIdInput, setLookupIdInput] = useState<string>("");

  const currentStatus: WorkflowStatus = state?.current_status || result?.status || "IDLE";
  const completedCount = state?.completed_tasks.length ?? result?.completed_tasks.length ?? 0;
  const failedCount = state?.failed_tasks.length ?? result?.failed_tasks.length ?? 0;
  const totalTasks = state?.plan.length || 6;
  const replanCount = state?.replanning_count ?? result?.replanning_count ?? 0;
  const executionTime = result?.execution_time ?? 0;
  const invokedToolsCount = state ? Object.keys(state.selected_tools || {}).length : 0;

  const getStatusBadge = (status: WorkflowStatus) => {
    switch (status) {
      case "WAITING_FOR_HUMAN":
        return {
          bg: "bg-[#F2B84B]/12 border-[#F2B84B]/40 text-[#F2B84B]",
          icon: <ShieldAlert className="h-4 w-4 text-[#F2B84B] animate-pulse" />,
          label: "Waiting For Human Approval",
          dot: "bg-[#F2B84B]",
        };
      case "EXECUTING":
      case "UNDERSTANDING":
      case "PLANNING":
      case "OBSERVING":
        return {
          bg: "bg-[#64A7FF]/12 border-[#64A7FF]/40 text-[#64A7FF]",
          icon: <Activity className="h-4 w-4 text-[#64A7FF] animate-spin" />,
          label: status === "EXECUTING" ? "Autonomous Execution" : status,
          dot: "bg-[#64A7FF]",
        };
      case "COMPLETED":
        return {
          bg: "bg-[#20C997]/12 border-[#20C997]/40 text-[#20C997]",
          icon: <CheckCircle2 className="h-4 w-4 text-[#20C997]" />,
          label: "Goal Achieved Successfully",
          dot: "bg-[#20C997]",
        };
      case "FAILED":
        return {
          bg: "bg-[#F16D78]/12 border-[#F16D78]/40 text-[#F16D78]",
          icon: <AlertTriangle className="h-4 w-4 text-[#F16D78]" />,
          label: "Workflow Terminated / Failed",
          dot: "bg-[#F16D78]",
        };
      case "REPLANNING":
        return {
          bg: "bg-[#685BFF]/15 border-[#685BFF]/45 text-[#64A7FF]",
          icon: <RotateCcw className="h-4 w-4 text-[#685BFF] animate-spin" />,
          label: "Dynamic Replanning Active",
          dot: "bg-[#685BFF]",
        };
      default:
        return {
          bg: "bg-[#0E1217] border-[#1E242C] text-[#F2F4F7]",
          icon: <Clock className="h-4 w-4 text-[#F2F4F7]" />,
          label: status,
          dot: "bg-[#8A94A6]",
        };
    }
  };

  const statusBadge = getStatusBadge(currentStatus);

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(lookupIdInput.trim(), 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      onSelectRequestId(parsed);
      setLookupIdInput("");
    }
  };

  const getSummaryDotColor = (status?: WorkflowStatus) => {
    if (status === "COMPLETED") return "bg-[#20C997]";
    if (status === "WAITING_FOR_HUMAN") return "bg-[#F2B84B]";
    if (status === "FAILED") return "bg-[#F16D78]";
    return "bg-[#64A7FF]";
  };

  return (
    <div className="space-y-4">
      {/* Top Context & Quick Command Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 rounded-xl glass-panel">
        <div className="flex items-center space-x-3 min-w-0">
          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusBadge.dot}`} />
          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-xs font-mono uppercase tracking-wider font-semibold text-[#F2F4F7]">
                OPERATIONS <span className="text-[#39FF14]">COMMAND</span>
              </span>
              <span className="text-[#1E242C]">&bull;</span>
              <span className="text-xs font-mono font-semibold text-[#F2F4F7]">
                {activeRequestId ? `Active Request #REQ-${activeRequestId}` : "System Standby — Ready for Goal Dispatch"}
              </span>
              {state?.student_id && (
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#0E1217] border border-[#1E242C] text-[#64A7FF]">
                  Student: {state.student_id}
                </span>
              )}
              {state?.normalized_goal?.goal_type && (
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#685BFF]/15 border border-[#685BFF]/30 text-[#F2F4F7]">
                  {state.normalized_goal.goal_type}
                </span>
              )}
            </div>
            {state?.original_goal && (
              <p className="text-xs text-[#F2F4F7]/90 truncate mt-0.5 font-mono">
                Goal: &ldquo;{state.original_goal}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Right Controls: Lookup Request ID, Refresh, New Goal */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <form onSubmit={handleLookupSubmit} className="flex items-center">
            <div className="relative flex items-center">
              <Search className="h-3 w-3 text-[#8A94A6] absolute left-2.5 pointer-events-none" />
              <input
                type="number"
                min={1}
                value={lookupIdInput}
                onChange={(e) => setLookupIdInput(e.target.value)}
                placeholder="Load Req #"
                aria-label="Load workflow by request ID"
                className="w-28 pl-7 pr-2 py-1 rounded-l-md bg-[#000000] border border-[#1E242C] text-xs font-mono text-[#F2F4F7] placeholder-[#8A94A6] focus:outline-none focus:border-[#39FF14]/60"
              />
              <button
                type="submit"
                disabled={isLoading || !lookupIdInput.trim()}
                className="px-2.5 py-1 rounded-r-md bg-[#0E1217] border border-l-0 border-[#1E242C] hover:border-[#39FF14]/50 text-xs font-mono text-[#F2F4F7] transition disabled:opacity-40 cursor-pointer"
              >
                Load
              </button>
            </div>
          </form>

          {activeRequestId && onRefreshActiveRequest && (
            <button
              type="button"
              onClick={onRefreshActiveRequest}
              disabled={isLoading}
              title="Refresh active workflow state and trace"
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#0E1217] border border-[#1E242C] hover:border-[#39FF14]/40 text-xs font-mono text-[#F2F4F7] transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin text-[#64A7FF]" : ""}`} />
              <span>Sync</span>
            </button>
          )}

          {onFocusComposer && (
            <button
              type="button"
              onClick={onFocusComposer}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-md bg-[#685BFF]/15 border border-[#685BFF]/40 hover:bg-[#685BFF]/25 text-xs font-medium text-[#F2F4F7] transition cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5 text-[#39FF14]" />
              <span>New Dispatch</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Core Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Current Status */}
        <div className="glass-panel rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-[#F2F4F7] mb-2.5">
            <span>
              WORKFLOW <span className="text-[#39FF14]">STATE</span>
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#0E1217] border border-[#1E242C] text-[#F2F4F7] font-normal">
              {activeRequestId ? `#REQ-${activeRequestId}` : "IDLE"}
            </span>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <div
              className={`inline-flex items-center space-x-2 px-2.5 py-1 rounded-md text-xs font-medium border ${statusBadge.bg}`}
            >
              {statusBadge.icon}
              <span>{statusBadge.label}</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#1E242C] flex items-center justify-between text-[11px] font-mono text-[#F2F4F7]/90">
            <span>GOVERNANCE GATE:</span>
            <span
              className={
                state?.human_approval_status === "APPROVED"
                  ? "text-[#20C997] font-semibold"
                  : state?.human_approval_status === "PENDING"
                  ? "text-[#F2B84B] font-semibold"
                  : state?.human_approval_status === "REJECTED"
                  ? "text-[#F16D78] font-semibold"
                  : "text-[#8A94A6]"
              }
            >
              {state?.human_approval_status || "NONE"}
            </span>
          </div>
        </div>

        {/* Metric 2: Completed Tasks */}
        <div className="glass-panel rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-[#F2F4F7] mb-2">
            <span>
              TASK <span className="text-[#39FF14]">PROGRESSION</span>
            </span>
            <Zap className="h-3.5 w-3.5 text-[#39FF14]" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-[#F2F4F7]">{completedCount}</span>
              <span className="text-xs text-[#F2F4F7]/85 font-mono">/ {totalTasks} tasks</span>
            </div>
            {failedCount > 0 && (
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#F16D78]/15 border border-[#F16D78]/30 text-[#F16D78]">
                {failedCount} failed
              </span>
            )}
          </div>
          <div className="w-full bg-[#0E1217] rounded-full h-1.5 mt-3 overflow-hidden border border-[#1E242C]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                currentStatus === "FAILED"
                  ? "bg-gradient-to-r from-[#685BFF] to-[#F16D78]"
                  : currentStatus === "COMPLETED"
                  ? "bg-gradient-to-r from-[#008F45] to-[#39FF14]"
                  : "bg-gradient-to-r from-[#685BFF] to-[#64A7FF]"
              }`}
              style={{
                width: `${totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-[#F2F4F7]/90">
            <span>{completedCount} completed</span>
            <span>{state?.pending_tasks.length ?? 0} pending</span>
          </div>
        </div>

        {/* Metric 3: Replanning & Retries */}
        <div className="glass-panel rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-[#F2F4F7] mb-2">
            <span>
              REPLANNING <span className="text-[#39FF14]">EVENTS</span>
            </span>
            <RotateCcw className="h-3.5 w-3.5 text-[#685BFF]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-[#F2F4F7]">{replanCount}</span>
            <span className="text-xs text-[#F2F4F7]/85 font-mono">/ 3 max allowed</span>
          </div>
          <p className="text-[11px] text-[#F2F4F7]/90 mt-2.5 pt-2 border-t border-[#1E242C]">
            {replanCount === 0
              ? "Nominal path (0 recoveries needed)"
              : currentStatus === "FAILED" && replanCount >= 3
              ? `Bounded retry limit (${replanCount}/3) reached`
              : `${replanCount} transient failure(s) self-healed`}
          </p>
        </div>

        {/* Metric 4: Registered Tools & Latency */}
        <div className="glass-panel rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-[#F2F4F7] mb-2">
            <span>
              TOOL REGISTRY &amp; <span className="text-[#39FF14]">LATENCY</span>
            </span>
            <Wrench className="h-3.5 w-3.5 text-[#39FF14]" />
          </div>
          <div className="flex items-baseline space-x-3">
            <div>
              <span className="text-2xl font-bold font-mono text-[#F2F4F7]">{tools.length}</span>
              <span className="text-xs text-[#F2F4F7]/85 font-mono ml-1">tools</span>
            </div>
            {invokedToolsCount > 0 && (
              <div className="border-l border-[#1E242C] pl-3">
                <span className="text-sm font-mono text-[#20C997] font-semibold">
                  {invokedToolsCount}
                </span>
                <span className="text-[10px] text-[#8A94A6] block font-mono">invoked</span>
              </div>
            )}
            {executionTime > 0 && (
              <div className="border-l border-[#1E242C] pl-3">
                <span className="text-sm font-mono text-[#64A7FF] font-semibold">
                  {executionTime}s
                </span>
                <span className="text-[10px] text-[#8A94A6] block font-mono">runtime</span>
              </div>
            )}
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#1E242C] flex items-center justify-between gap-2">
            <p className="text-[11px] text-[#F2F4F7]/90 truncate font-mono">
              {tools.length > 0
                ? `${tools.map((t) => t.name).slice(0, 2).join(", ")} +${Math.max(0, tools.length - 2)} more`
                : "No tools loaded"}
            </p>
            {onNavigateToSection && (
              <button
                type="button"
                onClick={() => onNavigateToSection("registry")}
                className="inline-flex items-center space-x-0.5 text-[11px] font-mono text-[#39FF14] hover:text-[#F2F4F7] shrink-0 cursor-pointer"
              >
                <span>Inspect</span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recent requests quick selector */}
      {recentRequestIds.length > 0 && (
        <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-lg glass-panel text-xs font-mono overflow-x-auto">
          <div className="flex items-center space-x-2 min-w-0">
            <span className="text-[#F2F4F7] font-semibold shrink-0">
              SESSION <span className="text-[#39FF14]">WORKFLOWS</span>:
            </span>
            <div className="flex items-center space-x-1.5">
              {recentRequestIds.map((id) => {
                const summary = sessionSummaries[id];
                const isSelected = activeRequestId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelectRequestId(id)}
                    disabled={isLoading}
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs transition border cursor-pointer ${
                      isSelected
                        ? "bg-[#0E1217] border-[#39FF14]/55 text-[#F2F4F7] font-semibold"
                        : "bg-[#0E1217] border-[#1E242C] text-[#F2F4F7]/85 hover:text-[#F2F4F7] hover:border-[#39FF14]/40"
                    }`}
                  >
                    {summary && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${getSummaryDotColor(summary.status)}`}
                      />
                    )}
                    <span>Req #{id}</span>
                    {summary?.student_id && (
                      <span className="text-[10px] text-[#8A94A6]">({summary.student_id})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <span className="text-[11px] text-[#8A94A6] hidden sm:inline shrink-0">
            Select a record to synchronize plan, governance &amp; trace
          </span>
        </div>
      )}
    </div>
  );
}
