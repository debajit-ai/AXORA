"use client";

import React from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  User,
  X,
} from "lucide-react";
import { AgentState } from "../types/api";

interface HumanApprovalCenterProps {
  state: AgentState | null;
  onApprove: (requestId: number) => Promise<void>;
  onReject: (requestId: number) => Promise<void>;
  isLoading: boolean;
}

export function HumanApprovalCenter({
  state,
  onApprove,
  onReject,
  isLoading,
}: HumanApprovalCenterProps) {
  // CRITICAL REQUIREMENT: Never display approval controls for a workflow that is not awaiting human approval
  if (
    !state ||
    state.current_status !== "WAITING_FOR_HUMAN" ||
    state.human_approval_status !== "PENDING"
  ) {
    return null;
  }

  const requestId = state.request_id;
  const normalizedParams = state.normalized_goal?.parameters || {};
  const reason = String(normalizedParams.reason || "personal leave");
  const days = String(normalizedParams.days || 1);

  const pendingTaskId = state.pending_tasks[0] || "t5";
  const pendingTask = state.plan.find((t) => t.task_id === pendingTaskId);
  const pendingTool =
    pendingTask?.candidate_tools[0] || "create_leave_application";

  const eligibilityPayload = state.tool_results?.["t4"] as
    | { eligible?: boolean; reason?: string }
    | undefined;

  return (
    <div className="rounded-xl border border-[#F2B84B]/55 bg-gradient-to-b from-[#F2B84B]/[0.08] via-[#090B0E] to-[#090B0E] p-5 shadow-[0_8px_32px_-8px_rgba(242,184,75,0.2)] relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#F2B84B]/25">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-[#F2B84B]/15 border border-[#F2B84B]/40 text-[#F2B84B]">
            <ShieldAlert className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-sm font-bold tracking-wider text-[#F2F4F7] uppercase">
                Human-in-the-Loop <span className="text-[#39FF14]">Approval</span> Required
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-[#F2B84B]/20 border border-[#F2B84B]/45 text-[#F2B84B]">
                Action Paused
              </span>
            </div>
            <p className="text-xs text-[#F2F4F7]/85 mt-0.5">
              The autonomous agent paused before executing a consequential campus administrative action.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#000000] border border-[#1E242C] text-[#F2F4F7] shrink-0">
          Req #{requestId}
        </span>
      </div>

      {/* Action Details Card */}
      <div className="mt-4 p-4 rounded-lg bg-[#000000]/90 border border-[#1E242C] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-mono text-[#F2F4F7]">TARGET CONTEXT:</span>
          <span className="font-mono text-[#64A7FF] font-semibold flex items-center space-x-1.5">
            <User className="h-3.5 w-3.5" />
            <span>Student: {state.student_id}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-lg bg-[#0E1217] border border-[#1E242C]">
            <span className="text-[10px] font-mono text-[#8A94A6] uppercase block">
              Consequential Task
            </span>
            <span className="text-xs font-semibold text-[#F2F4F7] mt-0.5 block">
              Task {pendingTask?.task_id || "t5"}:{" "}
              {pendingTask?.description || "Create Leave Application"}
            </span>
            <span className="text-[11px] text-[#F2F4F7]/85 block mt-0.5">
              Tool: <code className="text-[#64A7FF] font-mono">{pendingTool}</code>
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#0E1217] border border-[#1E242C]">
            <span className="text-[10px] font-mono text-[#8A94A6] uppercase block">
              Normalized Parameters
            </span>
            <span className="text-xs font-medium text-[#F2F4F7] mt-0.5 block truncate">
              Reason: &ldquo;{reason}&rdquo;
            </span>
            <span className="text-[11px] text-[#F2F4F7]/85 block mt-0.5">
              Duration: {days} day(s)
            </span>
          </div>
        </div>

        {/* Verification Checkmarks */}
        <div className="pt-2 text-xs text-[#98A3B6] space-y-1.5 font-mono">
          <div className="flex items-center space-x-2 text-[#20C997]">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>Pre-condition 1: Student profile verified (`get_student_profile`)</span>
          </div>
          <div className="flex items-center space-x-2 text-[#20C997]">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>
              Pre-condition 2: Attendance threshold satisfied (`&gt;= 75%`
              {eligibilityPayload?.reason ? ` — ${eligibilityPayload.reason}` : ""})
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[#20C997]">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>Pre-condition 3: Institutional leave policy retrieved (`get_leave_policy`)</span>
          </div>
        </div>
      </div>

      {/* Caution message */}
      <div className="mt-3 flex items-start space-x-2.5 text-xs text-[#F2B84B] bg-[#F2B84B]/10 p-3 rounded-lg border border-[#F2B84B]/25">
        <AlertTriangle className="h-4 w-4 shrink-0 text-[#F2B84B] mt-0.5" />
        <p className="text-[11px] leading-relaxed text-[#F1F4FA]/90">
          Approving will grant execution rights to submit the official campus leave application and verify receipt status. Rejecting will terminate the workflow safely with an audit trail.
        </p>
      </div>

      {/* Decision Controls */}
      <div className="mt-5 flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-[#252D3A]">
        <button
          type="button"
          onClick={() => onReject(requestId)}
          disabled={isLoading}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#F16D78]/12 hover:bg-[#F16D78]/20 border border-[#F16D78]/40 text-[#F16D78] transition disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <X className="h-3.5 w-3.5 text-[#F16D78]" />
          )}
          <span>Reject Workflow</span>
        </button>

        <button
          type="button"
          onClick={() => onApprove(requestId)}
          disabled={isLoading}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#20C997] hover:bg-[#1ab386] text-[#000000] shadow-[0_4px_20px_-2px_rgba(32,201,151,0.4)] transition disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Resuming Agent...</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4 stroke-[2.5]" />
              <span>Authorize &amp; Continue Execution</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
