"use client";

import React, { useState } from "react";
import { AlertCircle, ArrowRight, Loader2, Sparkles, UserCheck, UserX } from "lucide-react";
import { Student } from "../types/api";

interface NewRequestPanelProps {
  students: Student[];
  onSubmit: (studentId: string, goal: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const PRESET_GOALS = [
  {
    label: "Standard Leave (Alice - Eligible)",
    studentId: "S001",
    goal: "I want to apply for leave tomorrow because I have a family function.",
    description: "Nominal multi-step workflow. Alice has 75% attendance.",
    type: "nominal",
  },
  {
    label: "Medical Emergency (3 Days)",
    studentId: "S001",
    goal: "Apply for leave for 3 days due to medical emergency",
    description: "Extracts 3 days duration and medical reasons parameter.",
    type: "nominal",
  },
  {
    label: "Low Attendance Check (Bob - Ineligible)",
    studentId: "S002",
    goal: "I need leave for 2 days due to personal reasons",
    description: "Bob has only 50% attendance. Fails eligibility (<75%).",
    type: "ineligible",
  },
  {
    label: "Simulated Network Timeout (Self-Healing)",
    studentId: "S001",
    goal: "FAILURE_MODE=attendance_timeout",
    description: "Simulates transient timeout. Self-heals on replan #1.",
    type: "recoverable",
  },
  {
    label: "Persistent Timeout (Bounded Retries)",
    studentId: "S001",
    goal: "FAILURE_MODE=attendance_timeout_persistent",
    description: "Enforces MAX_REPLANS (3) limit before graceful termination.",
    type: "bounded",
  },
  {
    label: "Simulated Database Crash",
    studentId: "S001",
    goal: "FAILURE_MODE=unrecoverable",
    description: "Simulates unrecoverable tool crash. Halts immediately.",
    type: "unrecoverable",
  },
];

export function NewRequestPanel({
  students,
  onSubmit,
  isLoading,
  error,
}: NewRequestPanelProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("S001");
  const [goalText, setGoalText] = useState<string>(
    "I want to apply for leave tomorrow because I have a family function."
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId.trim() || !goalText.trim() || isLoading) return;
    await onSubmit(selectedStudentId.trim(), goalText.trim());
  };

  const handleApplyPreset = (preset: (typeof PRESET_GOALS)[0]) => {
    setSelectedStudentId(preset.studentId);
    setGoalText(preset.goal);
  };

  return (
    <div className="glass-panel rounded-xl p-5 border border-white/[0.08] relative">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
              Dispatch Campus Service Goal
            </h2>
            <p className="text-xs text-slate-300">
              Submit student intent to the autonomous agent orchestrator
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Student Selector */}
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1.5">
            1. SELECT DEMO STUDENT CONTEXT
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {students.length > 0 ? (
              students.map((student) => {
                const isSelected = selectedStudentId === student.student_id;
                const isEligible = student.student_id === "S001"; // Alice has 75%, Bob has 50%
                return (
                  <button
                    type="button"
                    key={student.student_id}
                    onClick={() => setSelectedStudentId(student.student_id)}
                    className={`flex items-start space-x-3 p-3 rounded-lg border text-left transition ${
                      isSelected
                        ? "bg-indigo-600/15 border-indigo-500/60 shadow-sm shadow-indigo-500/10"
                        : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12]"
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded mt-0.5 ${
                        isEligible
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {isEligible ? (
                        <UserCheck className="h-4 w-4" />
                      ) : (
                        <UserX className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white truncate">
                          {student.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-300">
                          {student.student_id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 truncate">{student.program}</p>
                      <p className="text-[10px] font-mono mt-0.5 text-slate-300">
                        {isEligible ? "Attendance: 75% (Eligible)" : "Attendance: 50% (Ineligible)"}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="col-span-2">
                <input
                  type="text"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  placeholder="Enter Student ID (e.g. S001)"
                  className="w-full bg-[#0a0c14] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* Goal Text Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-mono text-slate-300">
              2. STUDENT GOAL IN NATURAL LANGUAGE OR SIMULATION DIRECTIVE
            </label>
            <span className="text-[10px] font-mono text-slate-300">₹0-cost deterministic</span>
          </div>
          <textarea
            rows={3}
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            placeholder="Describe what the student wants the campus assistant to accomplish..."
            className="w-full bg-[#0a0c14] border border-white/[0.1] rounded-lg p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 font-mono transition resize-none leading-relaxed"
          />
        </div>

        {/* Presets */}
        <div>
          <span className="block text-[11px] font-mono text-slate-300 mb-1.5">
            TESTING PRESETS & SIMULATIONS:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {PRESET_GOALS.map((preset, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => handleApplyPreset(preset)}
                className="px-2.5 py-1.5 rounded-md text-left text-[11px] bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-indigo-500/40 transition group"
              >
                <div className="flex items-center space-x-1.5 font-medium text-slate-300 group-hover:text-white">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      preset.type === "nominal"
                        ? "bg-emerald-400"
                        : preset.type === "recoverable"
                        ? "bg-purple-400"
                        : preset.type === "ineligible"
                        ? "bg-amber-400"
                        : "bg-rose-400"
                    }`}
                  />
                  <span className="truncate">{preset.label}</span>
                </div>
                <p className="text-[10px] text-slate-300 mt-0.5 line-clamp-1">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <div className="pt-2 flex items-center justify-between">
          <span className="text-[11px] text-slate-300 font-mono">
            Press <kbd className="px-1 py-0.5 rounded bg-white/[0.08] text-slate-300">Ctrl+Enter</kbd> to launch
          </span>
          <button
            type="submit"
            disabled={isLoading || !goalText.trim()}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-500 via-blue-600 to-indigo-600 hover:from-indigo-400 hover:via-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Orchestrating...</span>
              </>
            ) : (
              <>
                <span>Execute Agent Workflow</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
