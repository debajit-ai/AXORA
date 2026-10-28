"use client";

import React from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  Cpu,
  Layers,
  LayoutGrid,
  RefreshCw,
  ShieldAlert,
  Terminal,
  WifiOff,
  Wrench,
} from "lucide-react";
import { HealthResponse, WorkspaceSection } from "../types/api";

interface HeaderProps {
  health: HealthResponse | null;
  healthLoading: boolean;
  healthLatencyMs?: number | null;
  onRefreshHealth: () => void;
  apiBaseUrl: string;
  activeSection?: WorkspaceSection;
  onSelectSection?: (section: WorkspaceSection) => void;
  pendingApproval?: boolean;
  traceCount?: number;
  toolCount?: number;
  activeRequestId?: number | null;
}

export function Header({
  health,
  healthLoading,
  healthLatencyMs,
  onRefreshHealth,
  apiBaseUrl,
  activeSection = "unified",
  onSelectSection,
  pendingApproval = false,
  traceCount = 0,
  toolCount = 0,
  activeRequestId = null,
}: HeaderProps) {
  const isOnline = health?.status === "healthy";
  const versionText = health?.version ? `v${health.version.replace(/^v/, "")}` : "v0.1.0";

  const navItems: {
    id: WorkspaceSection;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    badge?: string | number | null;
    alert?: boolean;
  }[] = [
    {
      id: "unified",
      label: "Operations Overview",
      shortLabel: "Overview",
      icon: <LayoutGrid className="h-3.5 w-3.5" />,
    },
    {
      id: "workspace",
      label: "Workflow Workspace",
      shortLabel: "Workspace",
      icon: <Layers className="h-3.5 w-3.5" />,
      badge: activeRequestId ? `#${activeRequestId}` : null,
      alert: pendingApproval,
    },
    {
      id: "observability",
      label: "Execution & Observability",
      shortLabel: "Observability",
      icon: <Terminal className="h-3.5 w-3.5" />,
      badge: traceCount > 0 ? traceCount : null,
    },
    {
      id: "evaluation",
      label: "Evaluation & Reliability",
      shortLabel: "Evaluation",
      icon: <BarChart3 className="h-3.5 w-3.5" />,
    },
    {
      id: "registry",
      label: "Tool Registry & System",
      shortLabel: "Tools & System",
      icon: <Wrench className="h-3.5 w-3.5" />,
      badge: toolCount > 0 ? toolCount : null,
    },
  ];

  return (
    <header className="border-b border-[#1E242C] bg-[#000000]/95 backdrop-blur-md sticky top-0 z-50">
      {/* Top Primary Bar */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Identity */}
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="relative h-9 w-9 rounded-lg bg-[#0E1217] flex items-center justify-center border border-[#685BFF]/50 shadow-[0_0_20px_-4px_rgba(104,91,255,0.35)] shrink-0">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#685BFF]/20 via-transparent to-[#64A7FF]/10 pointer-events-none" />
            <Cpu className="h-4.5 w-4.5 text-[#685BFF]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight text-[#F2F4F7]">
                CampVion
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-[#685BFF]/15 border border-[#685BFF]/35 text-[#64A7FF] font-medium">
                Ops Console
              </span>
              <span className="text-[11px] font-mono text-[#8A94A6] hidden sm:inline">
                {versionText}
              </span>
            </div>
            <p className="text-[11px] text-[#F2F4F7]/85 truncate hidden md:block">
              Intelligent Campus Operations &bull; Agentic AI Assistant for Multi-Step Campus Service Workflows
            </p>
          </div>
        </div>

        {/* Status & System Controls */}
        <div className="flex items-center space-x-2.5 shrink-0">
          {/* Pending Human Governance Alert Indicator */}
          {pendingApproval && (
            <button
              type="button"
              onClick={() => onSelectSection?.("workspace")}
              className="hidden lg: inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono bg-[#F2B84B]/15 border border-[#F2B84B]/40 text-[#F2B84B] hover:bg-[#F2B84B]/20 transition cursor-pointer"
            >
              <ShieldAlert className="h-3.5 w-3.5 animate-pulse" />
              <span>Approval Gate Active</span>
            </button>
          )}

          {/* Backend Connection Badge */}
          <div
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-mono border transition-all ${
              isOnline
                ? "bg-[#20C997]/10 border-[#20C997]/30 text-[#20C997]"
                : "bg-[#F16D78]/10 border-[#F16D78]/35 text-[#F16D78]"
            }`}
          >
            {isOnline ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#20C997] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#20C997]" />
                </span>
                <span className="font-medium">Backend Online</span>
                {typeof healthLatencyMs === "number" && healthLatencyMs >= 0 && (
                  <span className="text-[10px] text-[#98A3B6] border-l border-[#252D3A] pl-2 hidden sm:inline">
                    {healthLatencyMs}ms
                  </span>
                )}
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-[#F16D78]" />
                <span className="font-medium">Backend Offline</span>
              </>
            )}
            <button
              type="button"
              onClick={onRefreshHealth}
              disabled={healthLoading}
              title="Ping backend health endpoint"
              aria-label="Ping backend health endpoint"
              className="ml-1 p-0.5 text-[#98A3B6] hover:text-[#F1F4FA] rounded transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${healthLoading ? "animate-spin text-[#64A7FF]" : ""}`} />
            </button>
          </div>

          {/* Swagger API Docs Link */}
          <a
            href={`${apiBaseUrl.replace(/\/api$/, "")}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#0E1217] border border-[#1E242C] hover:border-[#39FF14]/45 text-[#F2F4F7] hover:bg-[#141920] transition"
          >
            <BookOpen className="h-3.5 w-3.5 text-[#64A7FF]" />
            <span className="hidden sm:inline">API Docs</span>
          </a>
        </div>
      </div>

      {/* Secondary Navigation Bar */}
      {onSelectSection && (
        <div className="border-t border-[#1E242C] bg-[#000000]/95 backdrop-blur-md">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 overflow-x-auto">
            <nav aria-label="Workspace Navigation" className="flex items-center space-x-1 py-1.5">
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectSection(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-[#0E1217] text-[#F2F4F7] border border-[#39FF14]/45 shadow-xs"
                        : "text-[#F2F4F7]/85 hover:text-[#F2F4F7] hover:bg-[#0E1217] border border-transparent"
                    }`}
                  >
                    <span className={isActive ? "text-[#39FF14]" : "text-[#F2F4F7]/75"}>
                      {item.icon}
                    </span>
                    <span className="hidden md:inline">{item.label}</span>
                    <span className="md:hidden">{item.shortLabel}</span>

                    {item.alert && (
                      <span className="h-2 w-2 rounded-full bg-[#F2B84B] animate-pulse" />
                    )}

                    {item.badge !== undefined && item.badge !== null && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                          isActive
                            ? "bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/35"
                            : "bg-[#090B0E] text-[#F2F4F7] border border-[#1E242C]"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Operational Engine Mode Indicator */}
            <div className="hidden xl:flex items-center space-x-3 text-[11px] font-mono text-[#8A94A6] shrink-0">
              <span className="flex items-center space-x-1.5 text-[#F2F4F7]">
                <Activity className="h-3 w-3 text-[#39FF14]" />
                <span>ENGINE: DETERMINISTIC DAG</span>
              </span>
              <span className="text-[#1E242C]">|</span>
              <span>MAX REPLANS: 3</span>
              <span className="text-[#1E242C]">|</span>
              <span>SQLITE AUDIT TRACE</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
