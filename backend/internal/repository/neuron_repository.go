package repository

import (
	"context"
	"database/sql"
	"synapsys-core/internal/domain"
)

type NeuronRepository interface {
	WithTx(ctx context.Context, fn func(*sql.Tx) error) error
	ListAll(ctx context.Context) ([]domain.Neuron, error)
	GetByNames(ctx context.Context, appName string, names []string) ([]domain.Neuron, error)
	Upsert(ctx context.Context, n domain.Neuron) error
	UpdateDesiredState(ctx context.Context, neuronName string, state domain.NeuronState) (bool, error)
	BatchUpsert(ctx context.Context, neurons []domain.Neuron) error
}
