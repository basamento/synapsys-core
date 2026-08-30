package service

import (
	"context"
	"database/sql"
	"synapsys-core/internal/domain"
	"time"
)

const healthCheckTimeout = 2 * time.Second

type HealthService struct {
	db *sql.DB
}

func NewHealthService(db *sql.DB) *HealthService {
	return &HealthService{db: db}
}

func (s *HealthService) Check(ctx context.Context) (domain.HealthStatus, error) {
	ctx, cancel := context.WithTimeout(ctx, healthCheckTimeout)
	defer cancel()

	var migrationCount int
	if err := s.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM schema_migrations").Scan(&migrationCount); err != nil {
		return domain.HealthStatus{Status: "unhealthy"}, err
	}
	return domain.HealthStatus{Status: "ok"}, nil
}
