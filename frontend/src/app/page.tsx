"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Header } from "../components/Header";
import { OverviewDashboard } from "../components/OverviewDashboard";
import { NewRequestPanel } from "../components/NewRequestPanel";
import { WorkflowStatus } from "../components/WorkflowStatus";
import { HumanApprovalCenter } from "../components/HumanApprovalCenter";
import { ExecutionTrace } from "../components/ExecutionTrace";
import { EvaluationSection } from "../components/EvaluationSection";
import { ToolRegistryPanel } from "../components/ToolRegistryPanel";
import { apiClient } from "../lib/api";
import {
  AgentResult,
  AgentState,
  AttendanceRecord,
  CourseRecord,
  HealthResponse,
  Student,
  Task,
  ToolSchema,
  TraceItem,
  WorkflowSessionSummary,
  WorkspaceSection,
} from "../types/api";

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [healthLatencyMs, setHealthLatencyMs] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceByStudent, setAttendanceByStudent] = useState<
    Record<string, AttendanceRecord[]>
  >({});
  const [coursesByStudent, setCoursesByStudent] = useState<
    Record<string, CourseRecord[]>
  >({});
  const [tools, setTools] = useState<ToolSchema[]>([]);

  const [activeSection, setActiveSection] = useState<WorkspaceSection>("unified");
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);
  const [recentRequestIds, setRecentRequestIds] = useState<number[]>([]);
  const [agentState, setAgentState] = useState<AgentState | null>(null);
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [traces, setTraces] = useState<TraceItem[]>([]);
  const [traceSearchQuery, setTraceSearchQuery] = useState<string>("");

  const [resultsById, setResultsById] = useState<Record<number, AgentResult>>({});
  const [sessionSummaries, setSessionSummaries] = useState<
    Record<number, WorkflowSessionSummary>
  >({});

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const composerTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const traceSectionRef = useRef<HTMLElement | null>(null);

  // Load initial backend dependencies, student attendance/courses, and tool schemas
  const loadInitialData = useCallback(async () => {
    setHealthLoading(true);
    const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    try {
      const [healthData, studentsData, toolsData] = await Promise.all([
        apiClient.checkHealth().catch(() => null),
        apiClient.listStudents().catch(() => []),
        apiClient.listTools().catch(() => []),
      ]);
      const elapsed = Math.max(
        1,
        Math.round(
          (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0
        )
      );
      setHealth(healthData);
      setHealthLatencyMs(healthData ? elapsed : null);
      setStudents(studentsData);
      setTools(toolsData);

      if (studentsData.length > 0) {
        const attendanceEntries = await Promise.all(
          studentsData.map(async (s) => {
            const records = await apiClient
              .getStudentAttendance(s.student_id)
              .catch(() => []);
            return [s.student_id, records] as const;
          })
        );
        const courseEntries = await Promise.all(
          studentsData.map(async (s) => {
            const courses = await apiClient
              .getStudentCourses(s.student_id)
              .catch(() => []);
            return [s.student_id, courses] as const;
          })
        );
        setAttendanceByStudent(Object.fromEntries(attendanceEntries));
        setCoursesByStudent(Object.fromEntries(courseEntries));
      }
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
      try {
        const [healthData, studentsData, toolsData] = await Promise.all([
          apiClient.checkHealth().catch(() => null),
          apiClient.listStudents().catch(() => []),
          apiClient.listTools().catch(() => []),
        ]);
        const elapsed = Math.max(
          1,
          Math.round(
            (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0
          )
        );
        if (!isMounted) return;
        setHealth(healthData);
        setHealthLatencyMs(healthData ? elapsed : null);
        setStudents(studentsData);
        setTools(toolsData);
        setHealthLoading(false);

        if (studentsData.length > 0) {
          const [attendanceEntries, courseEntries] = await Promise.all([
            Promise.all(
              studentsData.map(async (s) => {
                const records = await apiClient
                  .getStudentAttendance(s.student_id)
                  .catch(() => []);
                return [s.student_id, records] as const;
              })
            ),
            Promise.all(
              studentsData.map(async (s) => {
                const courses = await apiClient
                  .getStudentCourses(s.student_id)
                  .catch(() => []);
                return [s.student_id, courses] as const;
              })
            ),
          ]);
          if (isMounted) {
            setAttendanceByStudent(Object.fromEntries(attendanceEntries));
            setCoursesByStudent(Object.fromEntries(courseEntries));
          }
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

  // Load state, plan, and traces for a specific request ID and synchronize result/summary
  const fetchWorkflowDetails = useCallback(
    async (requestId: number, latestResult?: AgentResult) => {
      const [stateData, planData, traceData] = await Promise.all([
        apiClient.getAgentState(requestId).catch(() => null),
        apiClient.getAgentPlan(requestId).catch(() => []),
        apiClient.getAgentTrace(requestId).catch(() => []),
      ]);

      if (!stateData && !latestResult) {
        throw new Error(`Workflow request #${requestId} was not found.`);
      }

      if (stateData) {
        setAgentState(stateData);
      }
      setTasks(planData.length > 0 ? planData : stateData?.plan || []);
      setTraces(traceData);

      const resolvedResult: AgentResult | null =
        latestResult ||
        resultsById[requestId] ||
        (stateData
          ? {
              request_id: stateData.request_id,
              status: stateData.current_status,
              original_goal: stateData.original_goal,
              completed_tasks: stateData.completed_tasks,
              failed_tasks: stateData.failed_tasks,
              replanning_count: stateData.replanning_count,
              human_intervention_count:
                stateData.human_approval_required ||
                stateData.human_approval_status !== "NONE"
                  ? 1
                  : 0,
              final_message:
                stateData.final_result ||
                stateData.error ||
                (stateData.current_status === "WAITING_FOR_HUMAN"
                  ? "Waiting for human approval"
                  : ""),
              execution_time: 0,
              trace_id: stateData.request_id,
            }
          : null);

      if (resolvedResult) {
        setAgentResult(resolvedResult);
        setResultsById((prev) => ({ ...prev, [requestId]: resolvedResult }));
      }

      if (stateData || resolvedResult) {
        const summary: WorkflowSessionSummary = {
          request_id: requestId,
          student_id: stateData?.student_id || "S001",
          goal:
            stateData?.original_goal ||
            resolvedResult?.original_goal ||
            `Request #${requestId}`,
          status:
            stateData?.current_status || resolvedResult?.status || "IDLE",
          completed_count:
            stateData?.completed_tasks.length ??
            resolvedResult?.completed_tasks.length ??
            0,
          total_tasks: stateData?.plan.length || planData.length || 6,
          replanning_count:
            stateData?.replanning_count ??
            resolvedResult?.replanning_count ??
            0,
          human_approval_status: stateData?.human_approval_status || "NONE",
          execution_time: resolvedResult?.execution_time ?? 0,
          final_message: resolvedResult?.final_message || "",
          updated_at: new Date().toISOString(),
        };
        setSessionSummaries((prev) => ({ ...prev, [requestId]: summary }));
      }

      setRecentRequestIds((prev) => {
        if (!prev.includes(requestId)) {
          return [requestId, ...prev].slice(0, 10);
        }
        return prev;
      });
    },
    [resultsById]
  );

  // Submit new goal
  const handleLaunchAgent = async (studentId: string, goal: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient.runAgent({ student_id: studentId, goal });
      setAgentResult(result);
      setActiveRequestId(result.request_id);
      await fetchWorkflowDetails(result.request_id, result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to execute agent workflow";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Switch request ID or load historical request ID
  const handleSelectRequestId = async (requestId: number) => {
    setActiveRequestId(requestId);
    setIsLoading(true);
    setError(null);
    try {
      await fetchWorkflowDetails(requestId);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : `Failed to load workflow #${requestId}`;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh active workflow
  const handleRefreshActiveRequest = async () => {
    if (!activeRequestId) return;
    await handleSelectRequestId(activeRequestId);
  };

  // Human approval handler
  const handleApprove = async (requestId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient.approveWorkflow(requestId);
      setAgentResult(result);
      await fetchWorkflowDetails(requestId, result);
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
      await fetchWorkflowDetails(requestId, result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Rejection failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Contextual bridge: Inspect a specific tool's execution events in the Trace Log
  const handleInspectToolInTrace = (toolName: string) => {
    setTraceSearchQuery(toolName);
    if (activeSection !== "unified" && activeSection !== "observability") {
      setActiveSection("observability");
    }
    setTimeout(() => {
      traceSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  // Focus the natural-language goal composer
  const handleFocusComposer = () => {
    if (activeSection !== "unified" && activeSection !== "workspace") {
      setActiveSection("workspace");
    }
    setTimeout(() => {
      composerTextareaRef.current?.focus();
      composerTextareaRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 50);
  };

  const pendingApproval =
    agentState?.current_status === "WAITING_FOR_HUMAN" &&
    agentState?.human_approval_status === "PENDING";

  const orderedSessionSummaries = recentRequestIds
    .map((id) => sessionSummaries[id])
    .filter((s): s is WorkflowSessionSummary => Boolean(s));

  const showWorkspace =
    activeSection === "unified" || activeSection === "workspace";
  const showObservability =
    activeSection === "unified" || activeSection === "observability";
  const showEvaluation =
    activeSection === "unified" || activeSection === "evaluation";
  const showRegistry =
    activeSection === "unified" || activeSection === "registry";

  return (
    <div className="min-h-screen flex flex-col axora-bg-grid bg-transparent text-[#F1F4FA]">
      {/* Global Shell & Navigation Header */}
      <Header
        health={health}
        healthLoading={healthLoading}
        healthLatencyMs={healthLatencyMs}
        onRefreshHealth={loadInitialData}
        apiBaseUrl={apiClient.getBaseUrl()}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        pendingApproval={pendingApproval}
        traceCount={traces.length}
        toolCount={tools.length}
        activeRequestId={activeRequestId}
      />

      {/* Main Operations Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Section 1: Operations Overview & Metrics (Always visible for persistent operational context) */}
        <section aria-label="Overview Dashboard">
          <OverviewDashboard
            state={agentState}
            result={agentResult}
            tools={tools}
            recentRequestIds={recentRequestIds}
            activeRequestId={activeRequestId}
            onSelectRequestId={handleSelectRequestId}
            isLoading={isLoading}
            sessionSummaries={sessionSummaries}
            onRefreshActiveRequest={handleRefreshActiveRequest}
            onNavigateToSection={setActiveSection}
            onFocusComposer={handleFocusComposer}
          />
        </section>

        {/* Focused View Return Banner when viewing a single domain */}
        {activeSection !== "unified" && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#090B0E] border border-[#1E242C] text-xs font-mono">
            <span className="text-[#F2F4F7]">
              Focused Domain View:{" "}
              <strong className="text-[#39FF14] uppercase">{activeSection}</strong>
            </span>
            <button
              type="button"
              onClick={() => setActiveSection("unified")}
              className="text-[#F2F4F7] hover:text-[#39FF14] font-semibold cursor-pointer"
            >
              Return to Unified Operations Overview &rarr;
            </button>
          </div>
        )}

        {/* Section 2: Human Approval Center (Guarded: Only renders when awaiting approval) */}
        <section aria-label="Human Approval Center">
          <HumanApprovalCenter
            state={agentState}
            onApprove={handleApprove}
            onReject={handleReject}
            isLoading={isLoading}
          />
        </section>

        {/* Section 3 & 4: Centerpiece Workflow Workspace (Goal Dispatch & Topological Execution Pipeline) */}
        {showWorkspace && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Request Composer & Simulation Studio */}
            <div className="lg:col-span-5">
              <NewRequestPanel
                students={students}
                onSubmit={handleLaunchAgent}
                isLoading={isLoading}
                error={error}
                attendanceByStudent={attendanceByStudent}
                coursesByStudent={coursesByStudent}
                textareaRef={composerTextareaRef}
              />
            </div>

            {/* Topological Plan & Task Execution Pipeline */}
            <div className="lg:col-span-7">
              <WorkflowStatus
                state={agentState}
                result={agentResult}
                tasks={tasks}
                onInspectToolInTrace={handleInspectToolInTrace}
              />
            </div>
          </div>
        )}

        {/* Section 5: Execution & Observability (Decision Trace Audit Logs) */}
        {showObservability && (
          <section ref={traceSectionRef} aria-label="Execution Trace">
            <ExecutionTrace
              traces={traces}
              requestId={activeRequestId}
              searchQuery={traceSearchQuery}
              onSearchQueryChange={setTraceSearchQuery}
            />
          </section>
        )}

        {/* Section 6: Evaluation & Reliability */}
        {showEvaluation && (
          <section aria-label="Operational Telemetry">
            <EvaluationSection
              state={agentState}
              result={agentResult}
              traces={traces}
              sessionSummaries={orderedSessionSummaries}
              activeRequestId={activeRequestId}
              onSelectRequestId={handleSelectRequestId}
              onRunScenario={handleLaunchAgent}
              isLoading={isLoading}
            />
          </section>
        )}

        {/* Section 7: Tool Registry & System Diagnostics */}
        {showRegistry && (
          <section aria-label="Tool Registry and System Status">
            <ToolRegistryPanel
              tools={tools}
              state={agentState}
              traces={traces}
              health={health}
              healthLoading={healthLoading}
              healthLatencyMs={healthLatencyMs}
              apiBaseUrl={apiClient.getBaseUrl()}
              onRefreshHealth={loadInitialData}
              onInspectToolInTrace={handleInspectToolInTrace}
            />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1E242C] bg-[#000000]/95 py-4 text-center text-xs font-mono text-[#8A94A6]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-[#F2F4F7]">CampVion &bull; Intelligent Campus Operations &bull; Project 55</span>
          <span>
            Deterministic &bull; Zero External API Costs &bull; Human-in-the-Loop Safeguarded
          </span>
        </div>
      </footer>
    </div>
  );
}
