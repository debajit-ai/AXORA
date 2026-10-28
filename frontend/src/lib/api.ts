import {
  AgentResult,
  AgentState,
  AttendanceRecord,
  CourseRecord,
  HealthResponse,
  RunAgentPayload,
  Student,
  Task,
  ToolSchema,
  TraceItem,
} from "../types/api";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000/api";

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
      // Avoid stale cache in dev/operations console
      cache: "no-store",
    });

    if (!res.ok) {
      let errorBody: unknown;
      try {
        errorBody = await res.json();
      } catch {
        errorBody = await res.text();
      }

      let message = `API request failed: ${res.status} ${res.statusText}`;
      if (typeof errorBody === "object" && errorBody !== null && "detail" in errorBody) {
        const detail = (errorBody as { detail: unknown }).detail;
        if (typeof detail === "object" && detail !== null && "message" in detail) {
          message = String((detail as { message: unknown }).message);
        } else {
          message = String(detail);
        }
      }
      throw new ApiError(message, res.status, errorBody);
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : "Network error or backend unreachable";
    throw new ApiError(message, 0);
  }
}

export const apiClient = {
  getBaseUrl(): string {
    return BASE_URL;
  },

  async checkHealth(): Promise<HealthResponse> {
    return fetchJson<HealthResponse>("/health");
  },

  async listStudents(): Promise<Student[]> {
    return fetchJson<Student[]>("/students/");
  },

  async getStudent(studentId: string): Promise<Student> {
    return fetchJson<Student>(`/students/${studentId}`);
  },

  async getStudentAttendance(studentId: string): Promise<AttendanceRecord[]> {
    return fetchJson<AttendanceRecord[]>(`/students/${studentId}/attendance`);
  },

  async getStudentCourses(studentId: string): Promise<CourseRecord[]> {
    return fetchJson<CourseRecord[]>(`/students/${studentId}/courses`);
  },

  async listTools(): Promise<ToolSchema[]> {
    return fetchJson<ToolSchema[]>("/tools/");
  },

  async getTool(toolName: string): Promise<ToolSchema> {
    return fetchJson<ToolSchema>(`/tools/${toolName}`);
  },

  async runAgent(payload: RunAgentPayload): Promise<AgentResult> {
    return fetchJson<AgentResult>("/agent/run", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getAgentState(requestId: number): Promise<AgentState> {
    return fetchJson<AgentState>(`/agent/${requestId}`);
  },

  async getAgentPlan(requestId: number): Promise<Task[]> {
    return fetchJson<Task[]>(`/agent/${requestId}/plan`);
  },

  async getAgentTrace(requestId: number): Promise<TraceItem[]> {
    return fetchJson<TraceItem[]>(`/agent/${requestId}/trace`);
  },

  async approveWorkflow(requestId: number): Promise<AgentResult> {
    return fetchJson<AgentResult>(`/agent/${requestId}/approve`, {
      method: "POST",
    });
  },

  async rejectWorkflow(requestId: number): Promise<AgentResult> {
    return fetchJson<AgentResult>(`/agent/${requestId}/reject`, {
      method: "POST",
    });
  },
};
