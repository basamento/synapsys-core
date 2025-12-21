package repository

import (
	"context"
	"database/sql"
	"synapsys-core/internal/domain"
)

type NeuronRepository interface {
	WithTx(ctx context.Context, fn func(*sql.Tx) error) error
	GetByNames(ctx context.Context, appName string, names []string) ([]domain.Neuron, error)
	Upsert(ctx context.Context, n domain.Neuron) error
	BatchUpsert(ctx context.Context, neurons []domain.Neuron) error
}
