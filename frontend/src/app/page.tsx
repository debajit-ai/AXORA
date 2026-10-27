"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Header } from "../components/Header";
import { OverviewDashboard } from "../components/OverviewDashboard";
import { NewRequestPanel } from "../components/NewRequestPanel";
import { WorkflowStatus } from "../components/WorkflowStatus";
import { HumanApprovalCenter } from "../components/HumanApprovalCenter";
import { ExecutionTrace } from "../components/ExecutionTrace";
import { EvaluationSection } from "../components/EvaluationSection";
import { apiClient } from "../lib/api";
import {
  AgentResult,
  AgentState,
  HealthResponse,
  Student,
  Task,
  ToolSchema,
  TraceItem,
} from "../types/api";

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [tools, setTools] = useState<ToolSchema[]>([]);

  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);
  const [recentRequestIds, setRecentRequestIds] = useState<number[]>([]);
  const [agentState, setAgentState] = useState<AgentState | null>(null);
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [traces, setTraces] = useState<TraceItem[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial backend dependencies
  const loadInitialData = useCallback(async () => {
    setHealthLoading(true);
    try {
      const [healthData, studentsData, toolsData] = await Promise.all([
        apiClient.checkHealth().catch(() => null),
        apiClient.listStudents().catch(() => []),
        apiClient.listTools().catch(() => []),
      ]);
      setHealth(healthData);
      setStudents(studentsData);
      setTools(toolsData);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [healthData, studentsData, toolsData] = await Promise.all([
          apiClient.checkHealth().catch(() => null),
          apiClient.listStudents().catch(() => []),
          apiClient.listTools().catch(() => []),
        ]);
        if (isMounted) {
          setHealth(healthData);
          setStudents(studentsData);
          setTools(toolsData);
          setHealthLoading(false);
        }
      } catch {
        if (isMounted) {
          setHealthLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load state and traces for a specific request ID
  const fetchWorkflowDetails = useCallback(async (requestId: number) => {
    try {
      const [stateData, planData, traceData] = await Promise.all([
        apiClient.getAgentState(requestId).catch(() => null),
        apiClient.getAgentPlan(requestId).catch(() => []),
        apiClient.getAgentTrace(requestId).catch(() => []),
      ]);

      if (stateData) setAgentState(stateData);
      if (planData.length > 0) setTasks(planData);
      if (traceData.length > 0) setTraces(traceData);
    } catch (err: unknown) {
      console.error("Failed to load workflow details", err);
    }
  }, []);

  // Submit new goal
  const handleLaunchAgent = async (studentId: string, goal: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient.runAgent({ student_id: studentId, goal });
      setAgentResult(result);
      setActiveRequestId(result.request_id);

      setRecentRequestIds((prev) => {
        if (!prev.includes(result.request_id)) {
          return [result.request_id, ...prev].slice(0, 8);
        }
        return prev;
      });

      await fetchWorkflowDetails(result.request_id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to execute agent workflow";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Switch request ID
  const handleSelectRequestId = async (requestId: number) => {
    setActiveRequestId(requestId);
    setIsLoading(true);
    try {
      await fetchWorkflowDetails(requestId);
    } finally {
      setIsLoading(false);
    }
  };

  // Human approval handler
  const handleApprove = async (requestId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient.approveWorkflow(requestId);
      setAgentResult(result);
      await fetchWorkflowDetails(requestId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Approval failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Human rejection handler
  const handleReject = async (requestId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient.rejectWorkflow(requestId);
      setAgentResult(result);
      await fetchWorkflowDetails(requestId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Rejection failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#08090d]">
      {/* Navigation Header */}
      <Header
        health={health}
        healthLoading={healthLoading}
        onRefreshHealth={loadInitialData}
        apiBaseUrl={apiClient.getBaseUrl()}
      />

      {/* Main Operations Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Section 1: Overview Dashboard & Metrics */}
        <section aria-label="Overview Dashboard">
          <OverviewDashboard
            state={agentState}
            result={agentResult}
            tools={tools}
            recentRequestIds={recentRequestIds}
            activeRequestId={activeRequestId}
            onSelectRequestId={handleSelectRequestId}
            isLoading={isLoading}
          />
        </section>

        {/* Section 2: Human Approval Center (Guarded: Only renders when awaiting approval) */}
        <section aria-label="Human Approval Center">
          <HumanApprovalCenter
            state={agentState}
            onApprove={handleApprove}
            onReject={handleReject}
            isLoading={isLoading}
          />
        </section>

        {/* Grid: New Request Form & Plan DAG Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Section 3: New Request Panel */}
          <div className="lg:col-span-5">
            <NewRequestPanel
              students={students}
              onSubmit={handleLaunchAgent}
              isLoading={isLoading}
              error={error}
            />
          </div>

          {/* Section 4: Workflow Status & Topological Tasks */}
          <div className="lg:col-span-7">
            <WorkflowStatus
              state={agentState}
              result={agentResult}
              tasks={tasks}
            />
          </div>
        </div>

        {/* Section 5: Execution Trace Audit Logs */}
        <section aria-label="Execution Trace">
          <ExecutionTrace
            traces={traces}
            requestId={activeRequestId}
          />
        </section>

        {/* Section 6: Evaluation & Telemetry */}
        <section aria-label="Operational Telemetry">
          <EvaluationSection
            state={agentState}
            result={agentResult}
            traces={traces}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#07080c] py-4 text-center text-xs font-mono text-slate-300">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AXORA Agentic Operations Console &bull; Project 55</span>
          <span>Deterministic &bull; Zero External API Costs &bull; Human-in-the-Loop Safeguarded</span>
        </div>
      </footer>
    </div>
  );
}
