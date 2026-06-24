package service

import (
	"context"
	"synapsys-core/internal/domain"
	"synapsys-core/internal/repository"
	"time"
)

type WorkerDTO struct {
	ID              int64     `json:"id"`
	Name            string    `json:"name"`
	FirstConnection time.Time `json:"firstConnection"`
	LastConnection  time.Time `json:"lastConnection"`
	Framework       string    `json:"framework"`
	Host            string    `json:"host"`
	LastTouch       time.Time `json:"lastTouch"`
}

type ProcessDTO struct {
	ID           int64     `json:"id"`
	Name         string    `json:"name"`
	WorkerID     int64     `json:"workerId"`
	Type         string    `json:"type"`
	CreatedAt    time.Time `json:"createdAt"`
	PingTiming   int       `json:"pingTiming"`
	DesiredToken int64     `json:"desiredToken"`
	AckToken     int64     `json:"ackToken"`
	RunID        *int64    `json:"runId,omitempty"`
}

type ExecutionDTO struct {
	ID            int64     `json:"id"`
	ProcessID     int64     `json:"processId"`
	CreatedAt     time.Time `json:"createdAt"`
	ModifiedAt    time.Time `json:"modifiedAt"`
	CurrentStatus string    `json:"currentStatus"`
	DesiredState  string    `json:"desiredState"`
	Status        string    `json:"status"`
}

type ActionDTO struct {
	ID          int64     `json:"id"`
	ExecutionID int64     `json:"executionId"`
	CreatedAt   time.Time `json:"createdAt"`
	Status      string    `json:"status"`
	Type        string    `json:"type"`
}

type StateResponse struct {
	Workers    []WorkerDTO    `json:"workers"`
	Processes  []ProcessDTO   `json:"processes"`
	Executions []ExecutionDTO `json:"executions"`
	Actions    []ActionDTO    `json:"actions"`
}

type StateService struct {
	repo repository.NeuronRepository
}

func NewStateService(repo repository.NeuronRepository) *StateService {
	return &StateService{repo: repo}
}

func (s *StateService) GetState(ctx context.Context) (StateResponse, error) {
	state, err := s.repo.ListState(ctx)
	if err != nil {
		return StateResponse{}, err
	}

	return StateResponse{
		Workers:    toWorkerDTOs(state.Workers),
		Processes:  toProcessDTOs(state.Processes),
		Executions: toExecutionDTOs(state.Executions),
		Actions:    toActionDTOs(state.Actions),
	}, nil
}

func toWorkerDTOs(workers []domain.Worker) []WorkerDTO {
	dtos := make([]WorkerDTO, 0, len(workers))
	for _, worker := range workers {
		dtos = append(dtos, WorkerDTO{
			ID:              worker.ID,
			Name:            worker.Name,
			FirstConnection: worker.FirstConnection,
			LastConnection:  worker.LastConnection,
			Framework:       string(worker.Framework),
			Host:            worker.Host,
			LastTouch:       worker.LastTouch,
		})
	}
	return dtos
}

func toProcessDTOs(processes []domain.Process) []ProcessDTO {
	dtos := make([]ProcessDTO, 0, len(processes))
	for _, process := range processes {
		dtos = append(dtos, ProcessDTO{
			ID:           process.ID,
			Name:         process.Name,
			WorkerID:     process.WorkerID,
			Type:         string(process.Type),
			CreatedAt:    process.CreatedAt,
			PingTiming:   process.PingTiming,
			DesiredToken: process.DesiredToken,
			AckToken:     process.AckToken,
			RunID:        process.RunID,
		})
	}
	return dtos
}

func toExecutionDTOs(executions []domain.Execution) []ExecutionDTO {
	dtos := make([]ExecutionDTO, 0, len(executions))
	for _, execution := range executions {
		dtos = append(dtos, ExecutionDTO{
			ID:            execution.ID,
			ProcessID:     execution.ProcessID,
			CreatedAt:     execution.CreatedAt,
			ModifiedAt:    execution.ModifiedAt,
			CurrentStatus: string(execution.CurrentStatus),
			DesiredState:  string(execution.DesiredState),
			Status:        string(execution.Status),
		})
	}
	return dtos
}

func toActionDTOs(actions []domain.Action) []ActionDTO {
	dtos := make([]ActionDTO, 0, len(actions))
	for _, action := range actions {
		dtos = append(dtos, ActionDTO{
			ID:          action.ID,
			ExecutionID: action.ExecutionID,
			CreatedAt:   action.CreatedAt,
			Status:      string(action.Status),
			Type:        string(action.Type),
		})
	}
	return dtos
}
