import { apiFetch } from "@/api/client";

export type ExecutionLog = {
  id: number;
  executionId: number;
  sequence: number;
  timestamp: string;
  source: "stdout" | "stderr";
  level: "info" | "error";
  message: string;
};

type ExecutionLogsResponse = {
  executionId: number;
  logs: ExecutionLog[];
};

export async function fetchExecutionLogs(executionId: number, after = 0) {
  const params = new URLSearchParams({ after: String(after), limit: "1000" });
  const response = await apiFetch<ExecutionLogsResponse>(
    `/api/executions/${executionId}/logs?${params.toString()}`,
  );
  return response.logs;
}
