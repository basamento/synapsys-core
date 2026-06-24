export type WorkerFramework = "springboot" | "nodejs" | "python" | "unknown";

export type ProcessType = "endless" | "progressive";

export type ExecutionState = "idle" | "running" | "stopping";

export type ExecutionStatus = "active" | "inactive";

export type ActionStatus = "done" | "waiting" | "failed";

export type ActionType = "create" | "start" | "stop" | "heartbeat" | "ack";

export type Worker = {
  id: number;
  name: string;
  firstConnection: string;
  lastConnection: string;
  framework: WorkerFramework;
  host: string;
  lastTouch: string;
};

export type Process = {
  id: number;
  name: string;
  workerId: number;
  type: ProcessType;
  createdAt: string;
  pingTiming: number;
  desiredToken: number;
  ackToken: number;
  runId?: number | null;
};

export type Execution = {
  id: number;
  processId: number;
  createdAt: string;
  modifiedAt: string;
  currentStatus: ExecutionState;
  desiredState: ExecutionState;
  status: ExecutionStatus;
};

export type Action = {
  id: number;
  executionId: number;
  createdAt: string;
  status: ActionStatus;
  type: ActionType;
};

export type ProcessOverview = Process & {
  applicationName: string;
  workerName: string;
  framework: WorkerFramework;
  host: string;
  currentState: ExecutionState;
  desiredState: ExecutionState;
  status: ExecutionStatus;
  lastTouch: string;
};
