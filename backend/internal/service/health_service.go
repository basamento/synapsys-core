package service

import (
	"context"
	"synapsys-core/internal/domain"
)

type HealthService struct{}

func NewHealthService() *HealthService {
	return &HealthService{}
}

func (s *HealthService) Check(ctx context.Context) domain.HealthStatus {
	return domain.HealthStatus{
		Status: "ok",
	}
}
