export type WorkflowStatus =
  | "IDLE"
  | "UNDERSTANDING"
  | "PLANNING"
  | "EXECUTING"
  | "OBSERVING"
  | "REPLANNING"
  | "WAITING_FOR_HUMAN"
  | "COMPLETED"
  | "FAILED";

export type HumanApprovalStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export type WorkspaceSection =
  | "unified"
  | "workspace"
  | "observability"
  | "evaluation"
  | "registry";

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
}

export interface Student {
  id: number;
  student_id: string;
  name: string;
  email: string;
  program: string;
  semester: number;
}

export interface AttendanceRecord {
  id: number;
  student_id: string;
  course_id: number;
  attended_classes: number;
  total_classes: number;
}

export interface CourseRecord {
  id: number;
  course_code: string;
  course_name: string;
  faculty: string;
}

export interface ToolSchema {
  name: string;
  description: string;
  category: string;
  input_schema: Record<string, unknown>;
  requires_human_approval: boolean;
}

export interface Task {
  task_id: string;
  description: string;
  dependencies: string[];
  candidate_tools: string[];
  status: "PENDING" | "COMPLETED" | "FAILED";
  requires_human_approval: boolean;
}

export interface NormalizedGoal {
  goal_type: string;
  student_id: string;
  parameters: Record<string, unknown>;
  constraints?: string[];
}

export interface ObservationItem {
  task_id: string;
  observation: string;
}

export interface AgentState {
  request_id: number;
  student_id: string;
  original_goal: string;
  normalized_goal?: NormalizedGoal | null;
  current_status: WorkflowStatus;
  current_step: number;
  plan: Task[];
  completed_tasks: string[];
  pending_tasks: string[];
  failed_tasks: string[];
  observations: ObservationItem[];
  selected_tools: Record<string, string>;
  tool_results: Record<string, unknown>;
  replanning_count: number;
  human_approval_required: boolean;
  human_approval_status: HumanApprovalStatus;
  final_result?: string | null;
  error?: string | null;
}

export interface AgentResult {
  request_id: number;
  status: WorkflowStatus;
  original_goal: string;
  completed_tasks: string[];
  failed_tasks: string[];
  replanning_count: number;
  human_intervention_count: number;
  final_message: string;
  execution_time: number;
  trace_id?: number | null;
}

export interface TraceItem {
  id: number;
  request_id?: number | null;
  step_number: number;
  event_type: string;
  component: string;
  action: string;
  input_data?: string | null;
  output_data?: string | null;
  status: string;
  error_message?: string | null;
  timestamp: string;
}

export interface RunAgentPayload {
  student_id: string;
  goal: string;
}

export interface WorkflowSessionSummary {
  request_id: number;
  student_id: string;
  goal: string;
  status: WorkflowStatus;
  completed_count: number;
  total_tasks: number;
  replanning_count: number;
  human_approval_status: HumanApprovalStatus;
  execution_time: number;
  final_message: string;
  updated_at: string;
}
