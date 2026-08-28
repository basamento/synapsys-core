package service

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"synapsys-core/internal/domain"
	"synapsys-core/internal/repository"
	"time"
)

type ProcessListItem struct {
	ID           int64     `json:"id"`
	Name         string    `json:"name"`
	WorkerID     int64     `json:"workerId"`
	WorkerName   string    `json:"workerName"`
	Framework    string    `json:"framework"`
	Host         string    `json:"host"`
	Type         string    `json:"type"`
	CurrentState string    `json:"currentState"`
	DesiredState string    `json:"desiredState"`
	DesiredToken int64     `json:"desiredToken"`
	AckToken     int64     `json:"ackToken"`
	RunId        *int64    `json:"runId,omitempty"`
	Status       string    `json:"status"`
	LastTouch    time.Time `json:"lastTouch"`
	PingTiming   int       `json:"heartbeatInterval"`
}

type ProcessHeartbeat struct {
	Name         string                `json:"name"`
	Type         domain.ProcessType    `json:"type"`
	CurrentState domain.ExecutionState `json:"currentState"`
	AckToken     int64                 `json:"ackToken"`
}

type ProcessCommand struct {
	Name         string                `json:"name"`
	Type         domain.ProcessType    `json:"type"`
	DesiredState domain.ExecutionState `json:"desiredState"`
	DesiredToken int64                 `json:"desiredToken"`
	RunId        *int64                `json:"runId,omitempty"`
}

type HeartbeatRequest struct {
	WorkerName string
	Framework  domain.WorkerFramework
	Host       string
	PingTiming int
	Processes  []ProcessHeartbeat
	Logs       []domain.ProcessLog
}

type UpdateDesiredStateRequest struct {
	ProcessID    int64                 `json:"-"`
	DesiredState domain.ExecutionState `json:"desiredState"`
}

type HeartbeatResponse struct {
	Processes []ProcessCommand `json:"processes"`
}

type ProcessListResponse struct {
	Processes []ProcessListItem `json:"processes"`
}

type ProcessService struct {
	repo repository.ProcessRepository
}

func NewProcessService(repo repository.ProcessRepository) *ProcessService {
	return &ProcessService{repo: repo}
}

func (s *ProcessService) SyncProcesses(ctx context.Context, req HeartbeatRequest) (HeartbeatResponse, error) {
	now := time.Now()

	workerName := req.WorkerName
	if workerName == "" {
		return HeartbeatResponse{}, fmt.Errorf("worker name is required")
	}

	framework := req.Framework
	if framework == "" {
		framework = domain.WorkerFrameworkUnknown
	}

	worker := domain.Worker{
		Name:            workerName,
		FirstConnection: now,
		LastConnection:  now,
		Framework:       framework,
		Host:            req.Host,
		LastTouch:       now,
	}

	observations := make([]domain.ProcessObservation, 0, len(req.Processes))
	for _, hb := range req.Processes {
		observation := domain.ProcessObservation{
			Name:          hb.Name,
			Type:          hb.Type,
			CurrentStatus: hb.CurrentState,
			AckToken:      hb.AckToken,
			PingTiming:    req.PingTiming,
		}
		observations = append(observations, observation)
	}

	commands, err := s.repo.SyncHeartbeat(ctx, worker, observations, req.Logs)
	if err != nil {
		return HeartbeatResponse{}, err
	}

	resp := make([]ProcessCommand, 0, len(commands))
	for _, command := range commands {
		resp = append(resp, ProcessCommand{
			Name:         command.Name,
			Type:         command.Type,
			DesiredState: command.DesiredState,
			DesiredToken: command.DesiredToken,
			RunId:        command.RunID,
		})
	}

	return HeartbeatResponse{Processes: resp}, nil
}

func (s *ProcessService) ListAllProcesses(ctx context.Context) (ProcessListResponse, error) {
	views, err := s.repo.ListAll(ctx)
	if err != nil {
		slog.Error("failed to list processes", "error", err)
		return ProcessListResponse{}, fmt.Errorf("list all processes: %w", err)
	}

	now := time.Now()
	dtos := make([]ProcessListItem, 0, len(views))
	for _, view := range views {
		dtos = append(dtos, toProcessListItem(view, now))
	}

	return ProcessListResponse{
		Processes: dtos,
	}, nil
}

func (s *ProcessService) UpdateDesiredState(ctx context.Context, req UpdateDesiredStateRequest) (bool, error) {
	state := domain.ExecutionState(strings.ToLower(string(req.DesiredState)))
	if !state.ValidAsDesired() {
		return false, fmt.Errorf("invalid desired state: %q", req.DesiredState)
	}
	// Backward compatibility: if a client still sends IDLE to mean stop,
	// interpret it as STOPPING (explicit stop command).
	if state == domain.ExecutionStateIdle {
		state = domain.ExecutionStateStopping
	}
	var runID *int64
	if state == domain.ExecutionStateRunning {
		id := time.Now().UnixNano()
		runID = &id
	}
	return s.repo.UpdateDesiredCommand(ctx, req.ProcessID, state, runID)
}

func toProcessListItem(view domain.ProcessView, now time.Time) ProcessListItem {
	status := domain.ExecutionStatusActive
	duration := now.Sub(view.Worker.LastTouch)
	if duration > time.Duration(view.Process.PingTiming)*time.Second {
		status = domain.ExecutionStatusInactive
	}

	return ProcessListItem{
		ID:           view.Process.ID,
		Name:         view.Process.Name,
		WorkerID:     view.Worker.ID,
		WorkerName:   view.Worker.Name,
		Framework:    string(view.Worker.Framework),
		Host:         view.Worker.Host,
		Type:         string(view.Process.Type),
		CurrentState: string(view.Execution.CurrentStatus),
		DesiredState: string(view.Execution.DesiredState),
		Status:       string(status),
		LastTouch:    view.Worker.LastTouch,
		PingTiming:   view.Process.PingTiming,
		DesiredToken: view.Process.DesiredToken,
		AckToken:     view.Process.AckToken,
		RunId:        view.Process.RunID,
	}
}
