package repository

import (
	"context"
	"synapsys-core/internal/domain"
)

type NeuronRepository interface {
	ListAll(ctx context.Context) ([]domain.ProcessView, error)
	ListState(ctx context.Context, pagination domain.StatePagination) (domain.StateSnapshot, error)
	SyncHeartbeat(ctx context.Context, worker domain.Worker, observations []domain.ProcessObservation) ([]domain.ProcessCommand, error)
	UpdateDesiredCommand(ctx context.Context, processID int64, state domain.ExecutionState, runID *int64) (bool, error)
}
