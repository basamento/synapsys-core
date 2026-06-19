package domain

import (
	"fmt"
	"time"
)

type WorkerFramework string
type ProcessType string
type ExecutionState string
type ExecutionStatus string
type ActionStatus string
type ActionType string

const (
	WorkerFrameworkSpringBoot WorkerFramework = "springboot"
	WorkerFrameworkNodeJS     WorkerFramework = "nodejs"
	WorkerFrameworkPython     WorkerFramework = "python"
	WorkerFrameworkUnknown    WorkerFramework = "unknown"
)

const (
	ProcessTypeEndless     ProcessType = "endless"
	ProcessTypeProgressive ProcessType = "progressive"
)

const (
	ExecutionStateIdle     ExecutionState = "idle"
	ExecutionStateRunning  ExecutionState = "running"
	ExecutionStateStopping ExecutionState = "stopping"
)

const (
	ExecutionStatusActive   ExecutionStatus = "active"
	ExecutionStatusInactive ExecutionStatus = "inactive"
)

const (
	ActionStatusDone    ActionStatus = "done"
	ActionStatusWaiting ActionStatus = "waiting"
	ActionStatusFailed  ActionStatus = "failed"
)

const (
	ActionTypeCreate    ActionType = "create"
	ActionTypeStart     ActionType = "start"
	ActionTypeStop      ActionType = "stop"
	ActionTypeHeartbeat ActionType = "heartbeat"
	ActionTypeAck       ActionType = "ack"
)

// Backward-compatible aliases used by the existing HTTP contract.
type NeuronType = ProcessType
type NeuronState = ExecutionState
type NeuronStatus = ExecutionStatus

const (
	NeuronTypeEndless     = ProcessTypeEndless
	NeuronTypeProgressive = ProcessTypeProgressive
	NeuronStateIdle       = ExecutionStateIdle
	NeuronStateRunning    = ExecutionStateRunning
	NeuronStateStopping   = ExecutionStateStopping
	NeuronStatusActive    = ExecutionStatusActive
	NeuronStatusInactive  = ExecutionStatusInactive
)

func (f WorkerFramework) Valid() bool {
	return f == WorkerFrameworkSpringBoot ||
		f == WorkerFrameworkNodeJS ||
		f == WorkerFrameworkPython ||
		f == WorkerFrameworkUnknown
}

func (t ProcessType) Valid() bool {
	return t == ProcessTypeEndless || t == ProcessTypeProgressive
}

func (s ExecutionState) Valid() bool {
	return s == ExecutionStateIdle || s == ExecutionStateRunning || s == ExecutionStateStopping
}

func (s ExecutionStatus) Valid() bool {
	return s == ExecutionStatusActive || s == ExecutionStatusInactive
}

func (s ActionStatus) Valid() bool {
	return s == ActionStatusDone || s == ActionStatusWaiting || s == ActionStatusFailed
}

func (t ActionType) Valid() bool {
	return t == ActionTypeCreate ||
		t == ActionTypeStart ||
		t == ActionTypeStop ||
		t == ActionTypeHeartbeat ||
		t == ActionTypeAck
}

type Worker struct {
	ID              int64
	Name            string
	FirstConnection time.Time
	LastConnection  time.Time
	Framework       WorkerFramework
	Host            string
	LastTouch       time.Time
}

func (w Worker) Validate() error {
	if w.Name == "" {
		return fmt.Errorf("worker name is required")
	}
	if !w.Framework.Valid() {
		return fmt.Errorf("invalid worker framework: %q", w.Framework)
	}
	if w.Host == "" {
		return fmt.Errorf("worker host is required")
	}
	return nil
}

type Process struct {
	ID           int64
	Name         string
	WorkerID     int64
	Type         ProcessType
	CreatedAt    time.Time
	PingTiming   int
	DesiredToken int64
	AckToken     int64
	RunID        *int64
}

func (p Process) Validate() error {
	if p.Name == "" {
		return fmt.Errorf("process name is required")
	}
	if !p.Type.Valid() {
		return fmt.Errorf("invalid process type: %q", p.Type)
	}
	if p.PingTiming <= 0 {
		return fmt.Errorf("process ping timing must be positive")
	}
	if p.DesiredToken < 0 || p.AckToken < 0 {
		return fmt.Errorf("process tokens must be >= 0")
	}
	return nil
}

type Execution struct {
	ID            int64
	ProcessID     int64
	CreatedAt     time.Time
	ModifiedAt    time.Time
	CurrentStatus ExecutionState
	DesiredState  ExecutionState
	Status        ExecutionStatus
}

func (e Execution) Validate() error {
	if !e.CurrentStatus.Valid() {
		return fmt.Errorf("invalid execution current status: %q", e.CurrentStatus)
	}
	if !e.DesiredState.Valid() {
		return fmt.Errorf("invalid execution desired state: %q", e.DesiredState)
	}
	if !e.Status.Valid() {
		return fmt.Errorf("invalid execution status: %q", e.Status)
	}
	return nil
}

type Action struct {
	ID          int64
	ExecutionID int64
	CreatedAt   time.Time
	Status      ActionStatus
	Type        ActionType
}

type ProcessObservation struct {
	Name          string
	Type          ProcessType
	CurrentStatus ExecutionState
	AckToken      int64
	PingTiming    int
}

type ProcessCommand struct {
	Name         string
	Type         ProcessType
	DesiredState ExecutionState
	DesiredToken int64
	RunID        *int64
}

type ProcessView struct {
	Process
	Worker
	Execution
}
