"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Terminal,
} from "lucide-react";
import { TraceItem } from "../types/api";

interface ExecutionTraceProps {
  traces: TraceItem[];
  requestId: number | null;
}

export function ExecutionTrace({ traces, requestId }: ExecutionTraceProps) {
  const [filter, setFilter] = useState<string>("ALL");
  const [expandedTraceId, setExpandedTraceId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const filteredTraces = traces.filter((t) => {
    if (filter === "TOOLS") {
      return t.event_type.startsWith("TOOL") || t.component === "executor" || t.component === "tool_selector";
    }
    if (filter === "PLANNING") {
      return t.event_type.includes("GOAL") || t.event_type.includes("PLAN") || t.component === "planner" || t.component === "decomposer";
    }
    if (filter === "HUMAN") {
      return t.event_type.includes("HUMAN");
    }
    if (filter === "ERRORS") {
      return t.status === "failure" || Boolean(t.error_message) || t.event_type.includes("FAIL");
    }
    return true;
  });

  const handleCopyJson = (trace: TraceItem) => {
    const jsonStr = JSON.stringify(trace, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedId(trace.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportAll = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(traces, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `axora-trace-req-${requestId || "latest"}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getEventBadgeColor = (eventType: string, status: string) => {
    if (status === "failure" || eventType.includes("FAILED")) {
      return "bg-rose-500/15 border-rose-500/30 text-rose-300";
    }
    if (eventType.includes("HUMAN")) {
      return "bg-amber-500/15 border-amber-500/30 text-amber-300";
    }
    if (eventType.includes("REPLAN")) {
      return "bg-purple-500/15 border-purple-500/30 text-purple-300";
    }
    if (eventType.startsWith("TOOL")) {
      return "bg-blue-500/15 border-blue-500/30 text-blue-300";
    }
    if (eventType.includes("PLAN") || eventType.includes("GOAL")) {
      return "bg-indigo-500/15 border-indigo-500/30 text-indigo-300";
    }
    return "bg-emerald-500/15 border-emerald-500/30 text-emerald-300";
  };

  const formatJson = (jsonString: string | null | undefined) => {
    if (!jsonString) return null;
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  return (
    <div className="glass-panel rounded-xl p-5 border border-white/[0.08]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
                Decision Trace Audit Log
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                Chronological ({traces.length} steps)
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Complete verifiable log of agent reasoning, tool payloads, and observations
            </p>
          </div>
        </div>

        {/* Filter chips & Export */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-white/[0.03] p-1 rounded-lg border border-white/[0.08] text-[11px] font-mono">
            {["ALL", "TOOLS", "PLANNING", "HUMAN", "ERRORS"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-2 py-1 rounded transition cursor-pointer ${
                  filter === cat
                    ? "bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 font-semibold"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {traces.length > 0 && (
            <button
              onClick={handleExportAll}
              title="Download Trace JSON"
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-xs font-mono text-slate-300 hover:text-white transition cursor-pointer"
            >
              <Download className="h-3 w-3" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Traces List */}
      {traces.length === 0 ? (
        <div className="py-12 text-center text-slate-300">
          <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          <p className="text-xs font-mono">No traces recorded yet for this session.</p>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Launch a workflow to stream execution events in real time.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {filteredTraces.map((trace) => {
            const isExpanded = expandedTraceId === trace.id;
            const formattedInput = formatJson(trace.input_data);
            const formattedOutput = formatJson(trace.output_data);
            const badgeColor = getEventBadgeColor(trace.event_type, trace.status);

            return (
              <div
                key={trace.id}
                className="rounded-lg border border-white/[0.06] bg-black/30 hover:border-white/[0.12] transition overflow-hidden"
              >
                {/* Trace header row */}
                <div
                  onClick={() => setExpandedTraceId(isExpanded ? null : trace.id)}
                  className="p-3 flex items-center justify-between cursor-pointer select-none text-xs font-mono"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="text-[11px] font-bold text-slate-300 bg-white/[0.05] px-1.5 py-0.5 rounded shrink-0">
                      #{trace.step_number}
                    </span>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeColor} shrink-0`}>
                      {trace.event_type}
                    </span>

                    <span className="text-[10px] text-slate-300 px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] shrink-0">
                      {trace.component} &rsaquo; {trace.action}
                    </span>

                    {trace.error_message && (
                      <span className="text-[11px] text-rose-400 font-sans truncate">
                        &mdash; {trace.error_message}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        trace.status === "success"
                          ? "text-emerald-400 bg-emerald-500/10"
                          : trace.status === "failure"
                          ? "text-rose-400 bg-rose-500/10"
                          : "text-amber-400 bg-amber-500/10"
                      }`}
                    >
                      {trace.status}
                    </span>
                    <span className="text-[10px] text-slate-300 hidden md:inline">
                      {new Date(trace.timestamp).toLocaleTimeString()}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-300" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                    )}
                  </div>
                </div>

                {/* Expanded Trace Inspector */}
                {isExpanded && (
                  <div className="px-4 pb-3 pt-2 border-t border-white/[0.06] bg-black/40 text-xs font-mono space-y-3">
                    <div className="flex items-center justify-between text-slate-300 text-[11px]">
                      <span>TIMESTAMP: {trace.timestamp}</span>
                      <button
                        onClick={() => handleCopyJson(trace)}
                        className="flex items-center space-x-1 text-slate-300 hover:text-white transition cursor-pointer"
                      >
                        <Copy className="h-3 w-3" />
                        <span>{copiedId === trace.id ? "Copied!" : "Copy Step JSON"}</span>
                      </button>
                    </div>

                    {trace.error_message && (
                      <div className="p-2.5 rounded bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block uppercase text-[10px]">Error Detail:</span>
                          <p>{trace.error_message}</p>
                        </div>
                      </div>
                    )}

                    {formattedInput && (
                      <div>
                        <span className="text-slate-300 text-[10px] uppercase font-bold block mb-1">
                          Input Arguments Payload:
                        </span>
                        <pre className="p-2 rounded bg-[#0a0c14] border border-white/[0.06] text-[11px] text-indigo-300 overflow-x-auto">
                          {formattedInput}
                        </pre>
                      </div>
                    )}

                    {formattedOutput && (
                      <div>
                        <span className="text-slate-300 text-[10px] uppercase font-bold block mb-1">
                          Output / Observation Payload:
                        </span>
                        <pre className="p-2 rounded bg-[#0a0c14] border border-white/[0.06] text-[11px] text-emerald-300 overflow-x-auto">
                          {formattedOutput}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
