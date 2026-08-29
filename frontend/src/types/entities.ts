export type WorkerFramework = "springboot" | "nodejs" | "python" | "go" | "unknown";

export type ProcessType = "endless" | "progressive";

// States a process can be observed in. "failed" is reported by a worker after a
// process crashes; it is never a state an operator can ask for.
export type ExecutionState = "idle" | "running" | "stopping" | "failed";

// States an operator can command.
export type DesiredState = Exclude<ExecutionState, "failed">;

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
  // How many processes are registered to this worker, across every page.
  // Optional because a core older than this field simply omits it.
  processCount?: number;
};

export type Process = {
  id: number;
  name: string;
  workerId: number;
  type: ProcessType;
  createdAt: string;
  heartbeatInterval: number;
  desiredToken: number;
  ackToken: number;
  runId?: number | null;
};

export type Execution = {
  id: number;
  processId: number;
  runId?: number | null;
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
  workerName: string;
  framework: WorkerFramework;
  host: string;
  currentState: ExecutionState;
  desiredState: ExecutionState;
  status: ExecutionStatus;
  lastTouch: string;
};
