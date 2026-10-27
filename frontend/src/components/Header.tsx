"use client";

import React from "react";
import { BookOpen, Cpu, RefreshCw, WifiOff } from "lucide-react";
import { HealthResponse } from "../types/api";

interface HeaderProps {
  health: HealthResponse | null;
  healthLoading: boolean;
  onRefreshHealth: () => void;
  apiBaseUrl: string;
}

export function Header({ health, healthLoading, onRefreshHealth, apiBaseUrl }: HeaderProps) {
  const isOnline = health?.status === "healthy";

  return (
    <header className="border-b border-white/[0.08] bg-[#0a0c14]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 via-blue-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
            <Cpu className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                AXORA
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                Ops Console
              </span>
              <span className="text-[10px] font-mono text-slate-300">v0.1.0</span>
            </div>
            <p className="text-[11px] text-slate-300 hidden sm:block">
              Agentic AI Assistant for Multi-Step Campus Service Workflows
            </p>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center space-x-3">
          {/* Backend Connection Badge */}
          <div
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
              isOnline
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}
          >
            {isOnline ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-medium">Backend Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-rose-400" />
                <span className="font-medium">Backend Offline</span>
              </>
            )}
            <button
              onClick={onRefreshHealth}
              disabled={healthLoading}
              title="Ping backend"
              className="ml-1 p-0.5 hover:text-white rounded transition"
            >
              <RefreshCw className={`h-3 w-3 ${healthLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Swagger docs link */}
          <a
            href={`${apiBaseUrl.replace(/\/api$/, "")}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-indigo-500/30 text-slate-300 hover:text-white transition"
          >
            <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden md:inline">API Docs</span>
          </a>
        </div>
      </div>
    </header>
  );
}
