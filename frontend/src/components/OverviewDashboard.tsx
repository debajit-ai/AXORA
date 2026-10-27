"use client";

import React from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  ShieldAlert,
  Wrench,
  Zap,
} from "lucide-react";
import { AgentResult, AgentState, ToolSchema, WorkflowStatus } from "../types/api";

interface OverviewDashboardProps {
  state: AgentState | null;
  result: AgentResult | null;
  tools: ToolSchema[];
  recentRequestIds: number[];
  activeRequestId: number | null;
  onSelectRequestId: (id: number) => void;
  isLoading: boolean;
}

export function OverviewDashboard({
  state,
  result,
  tools,
  recentRequestIds,
  activeRequestId,
  onSelectRequestId,
  isLoading,
}: OverviewDashboardProps) {
  const currentStatus: WorkflowStatus = state?.current_status || result?.status || "IDLE";
  const completedCount = state?.completed_tasks.length ?? result?.completed_tasks.length ?? 0;
  const totalTasks = state?.plan.length || 6;
  const replanCount = state?.replanning_count ?? result?.replanning_count ?? 0;
  const executionTime = result?.execution_time ?? 0;

  const getStatusBadge = (status: WorkflowStatus) => {
    switch (status) {
      case "WAITING_FOR_HUMAN":
        return {
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
          icon: <ShieldAlert className="h-4 w-4 text-amber-400 animate-pulse" />,
          label: "Waiting For Human Approval",
        };
      case "EXECUTING":
        return {
          bg: "bg-blue-500/10 border-blue-500/30 text-blue-300",
          icon: <Activity className="h-4 w-4 text-blue-400 animate-spin" />,
          label: "Autonomous Execution",
        };
      case "COMPLETED":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
          label: "Goal Achieved Successfully",
        };
      case "FAILED":
        return {
          bg: "bg-rose-500/10 border-rose-500/30 text-rose-300",
          icon: <AlertTriangle className="h-4 w-4 text-rose-400" />,
          label: "Workflow Terminated / Failed",
        };
      case "REPLANNING":
        return {
          bg: "bg-purple-500/10 border-purple-500/30 text-purple-300",
          icon: <RotateCcw className="h-4 w-4 text-purple-400 animate-spin" />,
          label: "Dynamic Replanning Active",
        };
      default:
        return {
          bg: "bg-slate-500/10 border-slate-500/30 text-slate-300",
          icon: <Clock className="h-4 w-4 text-slate-400" />,
          label: status,
        };
    }
  };

  const statusBadge = getStatusBadge(currentStatus);

  return (
    <div className="space-y-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Current Status */}
        <div className="glass-panel rounded-xl p-4 border border-white/[0.08] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
            <span>WORKFLOW STATE</span>
            <span className="text-[10px] text-slate-300">
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
        </div>

        {/* Metric 2: Completed Tasks */}
        <div className="glass-panel rounded-xl p-4 border border-white/[0.08] relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
            <span>TASK PROGRESSION</span>
            <Zap className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white">{completedCount}</span>
            <span className="text-xs text-slate-300 font-mono">/ {totalTasks} tasks</span>
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Metric 3: Replanning & Retries */}
        <div className="glass-panel rounded-xl p-4 border border-white/[0.08] relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
            <span>REPLANNING EVENTS</span>
            <RotateCcw className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white">{replanCount}</span>
            <span className="text-xs text-slate-300 font-mono">/ 3 max allowed</span>
          </div>
          <p className="text-[11px] text-slate-300 mt-1">
            {replanCount === 0
              ? "Nominal path (0 recoveries needed)"
              : `${replanCount} transient failure(s) self-healed`}
          </p>
        </div>

        {/* Metric 4: Registered Tools & Latency */}
        <div className="glass-panel rounded-xl p-4 border border-white/[0.08] relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
            <span>TOOL REGISTRY & LATENCY</span>
            <Wrench className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-3">
            <div>
              <span className="text-2xl font-bold font-mono text-white">{tools.length}</span>
              <span className="text-xs text-slate-300 font-mono ml-1">tools</span>
            </div>
            {executionTime > 0 && (
              <div className="border-l border-white/[0.1] pl-3">
                <span className="text-sm font-mono text-indigo-300 font-semibold">
                  {executionTime}s
                </span>
                <span className="text-[10px] text-slate-300 block font-mono">runtime</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-300 mt-1 truncate">
            {tools.map((t) => t.name).slice(0, 2).join(", ")} +{Math.max(0, tools.length - 2)} more
          </p>
        </div>
      </div>

      {/* Recent requests quick selector */}
      {recentRequestIds.length > 0 && (
        <div className="flex items-center space-x-2 text-xs font-mono overflow-x-auto py-1">
          <span className="text-slate-300 shrink-0">SESSION WORKFLOWS:</span>
          <div className="flex items-center space-x-1.5">
            {recentRequestIds.map((id) => (
              <button
                key={id}
                onClick={() => onSelectRequestId(id)}
                disabled={isLoading}
                className={`px-2.5 py-1 rounded text-xs transition border ${
                  activeRequestId === id
                    ? "bg-indigo-600/30 border-indigo-500 text-indigo-200 font-bold"
                    : "bg-white/[0.03] border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                Req #{id}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
