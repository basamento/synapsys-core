package service

import (
	"context"
	"synapsys-core/internal/repository"
)

type ExecutionLogDTO struct {
	ID          int64  `json:"id"`
	ExecutionID int64  `json:"executionId"`
	Sequence    int64  `json:"sequence"`
	Timestamp   string `json:"timestamp"`
	Source      string `json:"source"`
	Level       string `json:"level"`
	Message     string `json:"message"`
}

type LogService struct {
	repo repository.NeuronRepository
}

func NewLogService(repo repository.NeuronRepository) *LogService {
	return &LogService{repo: repo}
}

func (s *LogService) ListExecutionLogs(ctx context.Context, executionID int64, afterSequence int64, limit int) ([]ExecutionLogDTO, error) {
	logs, err := s.repo.ListExecutionLogs(ctx, executionID, afterSequence, limit)
	if err != nil {
		return nil, err
	}
	dtos := make([]ExecutionLogDTO, 0, len(logs))
	for _, log := range logs {
		dtos = append(dtos, ExecutionLogDTO{
			ID:          log.ID,
			ExecutionID: log.ExecutionID,
			Sequence:    log.Sequence,
			Timestamp:   log.Timestamp.UTC().Format("2006-01-02T15:04:05.999999999Z07:00"),
			Source:      log.Source,
			Level:       log.Level,
			Message:     log.Message,
		})
	}
	return dtos, nil
}
