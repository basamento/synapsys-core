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
	ProcessCount    int       `json:"processCount"`
}

type ProcessDTO struct {
	ID           int64     `json:"id"`
	Name         string    `json:"name"`
	WorkerID     int64     `json:"workerId"`
	Type         string    `json:"type"`
	CreatedAt    time.Time `json:"createdAt"`
	PingTiming   int       `json:"heartbeatInterval"`
	DesiredToken int64     `json:"desiredToken"`
	AckToken     int64     `json:"ackToken"`
	RunID        *int64    `json:"runId,omitempty"`
}

type ExecutionDTO struct {
	ID            int64     `json:"id"`
	ProcessID     int64     `json:"processId"`
	RunID         *int64    `json:"runId,omitempty"`
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

type PageInfoDTO struct {
	Page       int `json:"page"`
	PageSize   int `json:"pageSize"`
	TotalItems int `json:"totalItems"`
	TotalPages int `json:"totalPages"`
}

type StatePaginationDTO struct {
	Workers    PageInfoDTO `json:"workers"`
	Processes  PageInfoDTO `json:"processes"`
	Executions PageInfoDTO `json:"executions"`
	Actions    PageInfoDTO `json:"actions"`
}

type StateResponse struct {
	Workers          []WorkerDTO        `json:"workers"`
	Processes        []ProcessDTO       `json:"processes"`
	Executions       []ExecutionDTO     `json:"executions"`
	Actions          []ActionDTO        `json:"actions"`
	ProcessOverviews []NeuronDTO        `json:"processOverviews"`
	Pagination       StatePaginationDTO `json:"pagination"`
}

type StateService struct {
	repo repository.NeuronRepository
}

func NewStateService(repo repository.NeuronRepository) *StateService {
	return &StateService{repo: repo}
}

func (s *StateService) GetState(ctx context.Context, pagination domain.StatePagination) (StateResponse, error) {
	state, err := s.repo.ListState(ctx, pagination)
	if err != nil {
		return StateResponse{}, err
	}

	return StateResponse{
		Workers:          toWorkerDTOs(state.Workers),
		Processes:        toProcessDTOs(state.Processes),
		Executions:       toExecutionDTOs(state.Executions),
		Actions:          toActionDTOs(state.Actions),
		ProcessOverviews: toProcessOverviewDTOs(state.ProcessViews),
		Pagination:       toStatePaginationDTO(state.Pagination),
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
			ProcessCount:    worker.ProcessCount,
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
			RunID:         execution.RunID,
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

func toProcessOverviewDTOs(views []domain.ProcessView) []NeuronDTO {
	now := time.Now()
	dtos := make([]NeuronDTO, 0, len(views))
	for _, view := range views {
		dtos = append(dtos, toNeuronDTO(view, now))
	}
	return dtos
}

func toStatePaginationDTO(pagination domain.StatePageInfo) StatePaginationDTO {
	return StatePaginationDTO{
		Workers:    toPageInfoDTO(pagination.Workers),
		Processes:  toPageInfoDTO(pagination.Processes),
		Executions: toPageInfoDTO(pagination.Executions),
		Actions:    toPageInfoDTO(pagination.Actions),
	}
}

func toPageInfoDTO(page domain.PageInfo) PageInfoDTO {
	return PageInfoDTO{
		Page:       page.Page,
		PageSize:   page.PageSize,
		TotalItems: page.TotalItems,
		TotalPages: page.TotalPages,
	}
}
