"use client";

import React, { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Database,
  ExternalLink,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  WifiOff,
  Wrench,
  XCircle,
} from "lucide-react";
import { AgentState, HealthResponse, ToolSchema, TraceItem } from "../types/api";

interface ToolRegistryPanelProps {
  tools: ToolSchema[];
  state: AgentState | null;
  traces: TraceItem[];
  health: HealthResponse | null;
  healthLoading: boolean;
  healthLatencyMs: number | null;
  apiBaseUrl: string;
  onRefreshHealth: () => void;
  onInspectToolInTrace?: (toolName: string) => void;
}

export function ToolRegistryPanel({
  tools,
  state,
  traces,
  health,
  healthLoading,
  healthLatencyMs,
  apiBaseUrl,
  onRefreshHealth,
  onInspectToolInTrace,
}: ToolRegistryPanelProps) {
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const isOnline = health?.status === "healthy";

  // Build map of tool usage in active workflow
  const selectedToolEntries = Object.entries(state?.selected_tools || {});
  const executedToolsMap = new Map<
    string,
    { taskIds: string[]; status: "COMPLETED" | "FAILED" | "PENDING" }
  >();

  for (const [taskId, toolName] of selectedToolEntries) {
    const isCompleted = state?.completed_tasks.includes(taskId);
    const isFailed = state?.failed_tasks.includes(taskId);
    const status = isCompleted ? "COMPLETED" : isFailed ? "FAILED" : "PENDING";
    const existing = executedToolsMap.get(toolName);
    if (existing) {
      existing.taskIds.push(taskId);
      if (status === "FAILED") existing.status = "FAILED";
      else if (status === "COMPLETED" && existing.status !== "FAILED") {
        existing.status = "COMPLETED";
      }
    } else {
      executedToolsMap.set(toolName, { taskIds: [taskId], status });
    }
  }

  const categories = [
    "ALL",
    ...Array.from(new Set(tools.map((t) => t.category))),
  ];

  const filteredTools = tools.filter(
    (t) => categoryFilter === "ALL" || t.category === categoryFilter
  );

  return (
    <div className="glass-panel rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1E242C]">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-[#0E1217] border border-[#39FF14]/35 text-[#39FF14]">
            <Wrench className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-sm font-semibold tracking-wide text-[#F2F4F7] uppercase">
                Tool Registry &amp; <span className="text-[#39FF14]">System Status</span>
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0E1217] border border-[#1E242C] text-[#F2F4F7]">
                {tools.length} Registered Tools
              </span>
              {executedToolsMap.size > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#20C997]/15 border border-[#20C997]/35 text-[#20C997]">
                  {executedToolsMap.size} Executed in Active Run
                </span>
              )}
            </div>
            <p className="text-xs text-[#F2F4F7]/85">
              Deterministic campus tool schemas, policy governance gates, and backend connectivity status
            </p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center bg-[#000000] p-1 rounded-lg border border-[#1E242C] text-[11px] font-mono overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded uppercase transition cursor-pointer ${
                categoryFilter === cat
                  ? "bg-[#0E1217] border border-[#39FF14]/50 text-[#F2F4F7] font-semibold"
                  : "text-[#F2F4F7]/80 hover:text-[#F2F4F7] border border-transparent"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* System Status & Backend Connectivity Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="p-3.5 rounded-lg bg-[#090B0E] border border-[#1E242C] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-lg border ${
                isOnline
                  ? "bg-[#20C997]/12 border-[#20C997]/35 text-[#20C997]"
                  : "bg-[#F16D78]/12 border-[#F16D78]/35 text-[#F16D78]"
              }`}
            >
              {isOnline ? (
                <Server className="h-4 w-4" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#8A94A6] block">
                BACKEND CONNECTIVITY
              </span>
              <span className="text-xs font-mono font-semibold text-[#F2F4F7]">
                {isOnline
                  ? `${(health?.service || "CampVion Backend").replace(/AXORA/gi, "CampVion")} (${health?.status})`
                  : "Unreachable / Offline"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onRefreshHealth}
            disabled={healthLoading}
            className="p-1.5 rounded bg-[#000000] border border-[#1E242C] text-[#F2F4F7] hover:border-[#39FF14]/45 transition cursor-pointer"
            title="Refresh backend status"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${healthLoading ? "animate-spin text-[#64A7FF]" : ""}`} />
          </button>
        </div>

        <div className="p-3.5 rounded-lg bg-[#090B0E] border border-[#1E242C] flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 rounded-lg bg-[#64A7FF]/12 border border-[#64A7FF]/35 text-[#64A7FF] shrink-0">
              <Database className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase text-[#8A94A6] block">
                API ENDPOINT &amp; PING
              </span>
              <span className="text-xs font-mono text-[#F2F4F7] truncate block">
                {apiBaseUrl}
              </span>
            </div>
          </div>
          {typeof healthLatencyMs === "number" && healthLatencyMs >= 0 && (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#000000] border border-[#1E242C] text-[#20C997] shrink-0">
              {healthLatencyMs}ms
            </span>
          )}
        </div>

        <div className="p-3.5 rounded-lg bg-[#090B0E] border border-[#1E242C] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[#685BFF]/15 border border-[#685BFF]/35 text-[#685BFF]">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#8A94A6] block">
                OPENAPI SPECIFICATION
              </span>
              <span className="text-xs font-mono text-[#F2F4F7]">
                FastAPI Swagger Docs ({health?.version || "0.1.0"})
              </span>
            </div>
          </div>
          <a
            href={`${apiBaseUrl.replace(/\/api$/, "")}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-[#000000] border border-[#1E242C] hover:border-[#39FF14]/45 text-xs font-mono text-[#F2F4F7] transition"
          >
            <span>Open</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Registered Tools Grid */}
      {filteredTools.length === 0 ? (
        <div className="py-8 text-center text-xs font-mono text-[#F2F4F7]">
          No registered tools loaded. Ensure the backend service is online.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTools.map((tool) => {
            const executionInfo = executedToolsMap.get(tool.name);
            const isExecuted = Boolean(executionInfo);
            const isExpanded = expandedTool === tool.name;

            // Count trace references for this tool
            const toolTraceCount = traces.filter(
              (t) =>
                t.output_data === tool.name ||
                (t.event_type.startsWith("TOOL") &&
                  (t.input_data?.includes(tool.name) || t.output_data?.includes(tool.name)))
            ).length;

            return (
              <div
                key={tool.name}
                className={`rounded-lg border transition-all ${
                  isExecuted
                    ? executionInfo?.status === "FAILED"
                      ? "bg-[#F16D78]/[0.05] border-[#F16D78]/40"
                      : "bg-[#20C997]/[0.05] border-[#20C997]/35"
                    : "bg-[#090B0E] border-[#1E242C]"
                }`}
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedTool(isExpanded ? null : tool.name)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setExpandedTool(isExpanded ? null : tool.name);
                    }
                  }}
                  className="p-3.5 flex items-start justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-mono text-xs font-semibold text-[#F2F4F7]">
                        {tool.name}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#000000] border border-[#1E242C] text-[#64A7FF]">
                        {tool.category}
                      </span>
                      {tool.requires_human_approval ? (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F2B84B]/15 border border-[#F2B84B]/35 text-[#F2B84B]">
                          <ShieldAlert className="h-2.5 w-2.5" />
                          <span>Human Approval Gate</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#000000] border border-[#1E242C] text-[#F2F4F7]">
                          <ShieldCheck className="h-2.5 w-2.5 text-[#20C997]" />
                          <span>Autonomous</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#F2F4F7]/85 mt-1.5">{tool.description}</p>

                    {/* Registered vs Executed status row */}
                    <div className="mt-2.5 flex items-center flex-wrap gap-2 text-[10px] font-mono">
                      {isExecuted ? (
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded border font-semibold ${
                            executionInfo?.status === "FAILED"
                              ? "bg-[#F16D78]/15 border-[#F16D78]/35 text-[#F16D78]"
                              : "bg-[#20C997]/15 border-[#20C997]/35 text-[#20C997]"
                          }`}
                        >
                          {executionInfo?.status === "FAILED" ? (
                            <XCircle className="h-3 w-3" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          <span>
                            Executed in Active Run (Task{" "}
                            {executionInfo?.taskIds.join(", ")}) &bull;{" "}
                            {executionInfo?.status}
                          </span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-[#000000] border border-[#1E2E24] text-[#98A3B6]">
                          Registered Catalog Tool (Idle in Current Run)
                        </span>
                      )}

                      {toolTraceCount > 0 && (
                        <span className="text-[#98A3B6]">
                          {toolTraceCount} trace event(s)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-[#98A3B6] shrink-0 mt-0.5">
                    <Code2 className="h-3.5 w-3.5" />
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </div>

                {/* Expanded Schema Inspector */}
                {isExpanded && (
                  <div className="px-4 pb-3.5 pt-2.5 border-t border-[#1E2E24] bg-[#000000]/90 text-xs font-mono space-y-2 rounded-b-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase text-[#98A3B6]">
                        JSON Input Schema Contract:
                      </span>
                      {isExecuted && onInspectToolInTrace && (
                        <button
                          type="button"
                          onClick={() => onInspectToolInTrace(tool.name)}
                          className="text-[11px] text-[#64A7FF] hover:text-[#F1F4FA] cursor-pointer"
                        >
                          Filter Trace by {tool.name} &rarr;
                        </button>
                      )}
                    </div>
                    <pre className="p-2.5 rounded bg-[#050806] border border-[#1E2E24] text-[11px] text-[#64A7FF] overflow-x-auto">
                      {JSON.stringify(tool.input_schema, null, 2)}
                    </pre>
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

