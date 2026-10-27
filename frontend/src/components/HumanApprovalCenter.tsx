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

  return (
    <div className="rounded-xl border border-amber-500/50 bg-gradient-to-b from-amber-950/30 via-[#0d0f17] to-[#0d0f17] p-5 shadow-xl shadow-amber-500/10 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      {/* Glow accent */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-amber-500/20">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/20">
            <ShieldAlert className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold tracking-wider text-amber-200 uppercase">
                Human-in-the-Loop Approval Required
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                Action Paused
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              The autonomous agent paused before executing a consequential campus administrative action.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono px-2.5 py-1 rounded bg-black/40 border border-white/[0.08] text-slate-300 shrink-0">
          Req #{requestId}
        </span>
      </div>

      {/* Action Details Card */}
      <div className="mt-4 p-4 rounded-lg bg-black/40 border border-white/[0.06] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-slate-300">TARGET CONTEXT:</span>
          <span className="font-mono text-indigo-300 font-semibold flex items-center space-x-1">
            <User className="h-3 w-3" />
            <span>Student: {state.student_id}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded bg-white/[0.02] border border-white/[0.06]">
            <span className="text-[10px] font-mono text-slate-300 uppercase block">
              Consequential Task
            </span>
            <span className="text-xs font-semibold text-white mt-0.5 block">
              Task t5: Create Leave Application
            </span>
            <span className="text-[11px] text-slate-300 block mt-0.5">
              Tool: <code className="text-indigo-300 font-mono">create_leave_application</code>
            </span>
          </div>

          <div className="p-3 rounded bg-white/[0.02] border border-white/[0.06]">
            <span className="text-[10px] font-mono text-slate-300 uppercase block">
              Normalized Parameters
            </span>
            <span className="text-xs font-medium text-slate-200 mt-0.5 block truncate">
              Reason: &ldquo;{reason}&rdquo;
            </span>
            <span className="text-[11px] text-slate-300 block mt-0.5">
              Duration: {days} day(s)
            </span>
          </div>
        </div>

        {/* Verification Checkmarks */}
        <div className="pt-2 text-xs text-slate-300 space-y-1.5 font-mono">
          <div className="flex items-center space-x-2 text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>Pre-condition 1: Student profile verified (`get_student_profile`)</span>
          </div>
          <div className="flex items-center space-x-2 text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>Pre-condition 2: Attendance threshold satisfied (`&gt;= 75%`)</span>
          </div>
          <div className="flex items-center space-x-2 text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>Pre-condition 3: Institutional leave policy retrieved (`get_leave_policy`)</span>
          </div>
        </div>
      </div>

      {/* Caution message */}
      <div className="mt-3 flex items-start space-x-2 text-xs text-amber-300/90 bg-amber-500/10 p-2.5 rounded border border-amber-500/20">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          Approving will grant execution rights to submit the official campus leave application and verify receipt status. Rejecting will terminate the workflow safely with an audit trail.
        </p>
      </div>

      {/* Decision Controls */}
      <div className="mt-5 flex items-center justify-end space-x-3 pt-3 border-t border-white/[0.08]">
        <button
          type="button"
          onClick={() => onReject(requestId)}
          disabled={isLoading}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 transition disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <X className="h-3.5 w-3.5 text-rose-400" />
          )}
          <span>Reject Workflow</span>
        </button>

        <button
          type="button"
          onClick={() => onApprove(requestId)}
          disabled={isLoading}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-400 hover:via-teal-500 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Resuming Agent...</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              <span>Authorize &amp; Continue Execution</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
