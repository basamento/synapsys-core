package service

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"synapsys-core/internal/domain"
	"synapsys-core/internal/repository"
	"time"
)

type NeuronDTO struct {
	ID              int64     `json:"id"`
	Name            string    `json:"name"`
	ApplicationName string    `json:"applicationName"`
	Type            string    `json:"type"`
	CurrentState    string    `json:"currentState"`
	DesiredState    string    `json:"desiredState"`
	Status          string    `json:"status"`
	LastTouch       time.Time `json:"lastTouch"`
	PingTiming      int       `json:"pingTiming"`
}

type NeuronHeartbeat struct {
	Name         string             `json:"name"`
	CurrentState domain.NeuronState `json:"currentState"`
	DesiredState domain.NeuronState `json:"desiredState"`
	Type         domain.NeuronType  `json:"type"`
}

type NeuronHeartbeatRequest struct {
	ApplicationName string
	PingTiming      int
	Neurons         []NeuronHeartbeat
}

type UpdateDesiredStateRequest struct {
	NeuronName   string             `json:"neuronName"`
	DesiredState domain.NeuronState `json:"desiredState"`
}

type NeuronHeartbeatResponse struct {
	Neurons []NeuronHeartbeat `json:"neurons"`
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
	neurons := make([]domain.Neuron, 0, len(req.Neurons))
	names := make([]string, 0, len(req.Neurons))
	for _, n := range req.Neurons {
		dn := domain.Neuron{
			Name:            n.Name,
			ApplicationName: req.ApplicationName,
			CurrentState:    n.CurrentState,
			DesiredState:    n.DesiredState,
			LastTouch:       now,
			Type:            n.Type,
			PingTiming:      req.PingTiming,
		}
		if err := dn.Validate(); err != nil {
			return NeuronHeartbeatResponse{}, err
		}
		neurons = append(neurons, dn)
		names = append(names, n.Name)
	}
	var dbNeurons []domain.Neuron

	err := s.repo.WithTx(ctx, func(tx *sql.Tx) error {
		if err := s.repo.BatchUpsert(ctx, neurons); err != nil {
			return err
		}

		var err error
		dbNeurons, err = s.repo.GetByNames(
			ctx,
			req.ApplicationName,
			names,
		)
		return err
	})

	if err != nil {
		return NeuronHeartbeatResponse{}, err
	}

	// here neurons should be all the neurons of req.Neurons fetched from the db after the upsert
	responseNeurons := make([]NeuronHeartbeat, 0, len(dbNeurons))

	for _, n := range dbNeurons {
		responseNeurons = append(responseNeurons, NeuronHeartbeat{
			Name:         n.Name,
			CurrentState: n.CurrentState,
			DesiredState: n.DesiredState,
			Type:         n.Type,
		})
	}

	return NeuronHeartbeatResponse{
		Neurons: responseNeurons,
	}, nil
}

func (s *NeuronService) ListAllNeurons(ctx context.Context) (NeuronListResponse, error) {
	neurons, err := s.repo.ListAll(ctx)
	if err != nil {
		slog.Error("failed to list neurons", "error", err)
		return NeuronListResponse{}, fmt.Errorf("list all neurons: %w", err)
	}

	now := time.Now()
	dtos := make([]NeuronDTO, 0, len(neurons))
	for _, n := range neurons {
		dtos = append(dtos, toNeuronDTO(n, now))
	}

	return NeuronListResponse{
		Neurons: dtos,
	}, nil
}

func (s *NeuronService) UpdateDesiredState(ctx context.Context, req UpdateDesiredStateRequest) (bool, error) {
	return s.repo.UpdateDesiredState(ctx, req.NeuronName, req.DesiredState)
}

func toNeuronDTO(n domain.Neuron, now time.Time) NeuronDTO {
	var status domain.NeuronStatus
	//var threshold int64 = 1000
	var duration = now.Sub(n.LastTouch)
	before := duration > time.Duration(n.PingTiming)*time.Millisecond
	if !before {
		status = domain.NeuronStatusActive
	} else {
		status = domain.NeuronStatusInactive
	}
	return NeuronDTO{
		ID:              n.ID,
		Name:            n.Name,
		ApplicationName: n.ApplicationName,
		Type:            string(n.Type),
		CurrentState:    string(n.CurrentState),
		DesiredState:    string(n.DesiredState),
		Status:          string(status),
		LastTouch:       n.LastTouch,
		PingTiming:      n.PingTiming,
	}
}
