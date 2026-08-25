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

type NeuronDTO struct {
	ID              int64     `json:"id"`
	Name            string    `json:"name"`
	ApplicationName string    `json:"applicationName"`
	WorkerID        int64     `json:"workerId"`
	WorkerName      string    `json:"workerName"`
	Framework       string    `json:"framework"`
	Host            string    `json:"host"`
	Type            string    `json:"type"`
	CurrentState    string    `json:"currentState"`
	DesiredState    string    `json:"desiredState"`
	DesiredToken    int64     `json:"desiredToken"`
	AckToken        int64     `json:"ackToken"`
	RunId           *int64    `json:"runId,omitempty"`
	Status          string    `json:"status"`
	LastTouch       time.Time `json:"lastTouch"`
	PingTiming      int       `json:"pingTiming"`
}

type NeuronHeartbeat struct {
	Name         string                `json:"name"`
	Type         domain.ProcessType    `json:"type"`
	CurrentState domain.ExecutionState `json:"currentState"`
	AckToken     int64                 `json:"ackToken"`
}

type NeuronCommand struct {
	Name         string                `json:"name"`
	Type         domain.ProcessType    `json:"type"`
	DesiredState domain.ExecutionState `json:"desiredState"`
	DesiredToken int64                 `json:"desiredToken"`
	RunId        *int64                `json:"runId,omitempty"`
}

type NeuronHeartbeatRequest struct {
	WorkerName      string
	ApplicationName string
	Framework       domain.WorkerFramework
	Host            string
	PingTiming      int
	Neurons         []NeuronHeartbeat
}

type UpdateDesiredStateRequest struct {
	ProcessID    int64                 `json:"-"`
	DesiredState domain.ExecutionState `json:"desiredState"`
}

type NeuronHeartbeatResponse struct {
	Neurons []NeuronCommand `json:"neurons"`
}

type NeuronListResponse struct {
	Neurons []NeuronDTO `json:"neurons"`
}

type NeuronService struct {
	repo repository.NeuronRepository
}

func NewNeuronsService(repo repository.NeuronRepository) *NeuronService {
	return &NeuronService{repo: repo}
}

func (s *NeuronService) SyncNeurons(ctx context.Context, req NeuronHeartbeatRequest) (NeuronHeartbeatResponse, error) {
	now := time.Now()

	workerName := req.WorkerName
	if workerName == "" {
		workerName = req.ApplicationName
	}
	if workerName == "" {
		return NeuronHeartbeatResponse{}, fmt.Errorf("worker name is required")
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

	observations := make([]domain.ProcessObservation, 0, len(req.Neurons))
	for _, hb := range req.Neurons {
		observation := domain.ProcessObservation{
			Name:          hb.Name,
			Type:          hb.Type,
			CurrentStatus: hb.CurrentState,
			AckToken:      hb.AckToken,
			PingTiming:    req.PingTiming,
		}
		observations = append(observations, observation)
	}

	commands, err := s.repo.SyncHeartbeat(ctx, worker, observations)
	if err != nil {
		return NeuronHeartbeatResponse{}, err
	}

	resp := make([]NeuronCommand, 0, len(commands))
	for _, command := range commands {
		resp = append(resp, NeuronCommand{
			Name:         command.Name,
			Type:         command.Type,
			DesiredState: command.DesiredState,
			DesiredToken: command.DesiredToken,
			RunId:        command.RunID,
		})
	}

	return NeuronHeartbeatResponse{Neurons: resp}, nil
}

func (s *NeuronService) ListAllNeurons(ctx context.Context) (NeuronListResponse, error) {
	views, err := s.repo.ListAll(ctx)
	if err != nil {
		slog.Error("failed to list processes", "error", err)
		return NeuronListResponse{}, fmt.Errorf("list all processes: %w", err)
	}

	now := time.Now()
	dtos := make([]NeuronDTO, 0, len(views))
	for _, view := range views {
		dtos = append(dtos, toNeuronDTO(view, now))
	}

	return NeuronListResponse{
		Neurons: dtos,
	}, nil
}

func (s *NeuronService) UpdateDesiredState(ctx context.Context, req UpdateDesiredStateRequest) (bool, error) {
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

func toNeuronDTO(view domain.ProcessView, now time.Time) NeuronDTO {
	status := domain.ExecutionStatusActive
	duration := now.Sub(view.Worker.LastTouch)
	if duration > time.Duration(view.Process.PingTiming)*time.Millisecond {
		status = domain.ExecutionStatusInactive
	}

	return NeuronDTO{
		ID:              view.Process.ID,
		Name:            view.Process.Name,
		ApplicationName: view.Worker.Name,
		WorkerID:        view.Worker.ID,
		WorkerName:      view.Worker.Name,
		Framework:       string(view.Worker.Framework),
		Host:            view.Worker.Host,
		Type:            string(view.Process.Type),
		CurrentState:    string(view.Execution.CurrentStatus),
		DesiredState:    string(view.Execution.DesiredState),
		Status:          string(status),
		LastTouch:       view.Worker.LastTouch,
		PingTiming:      view.Process.PingTiming,
		DesiredToken:    view.Process.DesiredToken,
		AckToken:        view.Process.AckToken,
		RunId:           view.Process.RunID,
	}
}
