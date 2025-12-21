package service

import (
	"context"
	"database/sql"
	"synapsys-core/internal/domain"
	"synapsys-core/internal/repository"
	"time"
)

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

type NeuronHeartbeatResponse struct {
	Neurons []NeuronHeartbeat `json:"neurons"`
}

type NeuronSyncService struct {
	repo repository.NeuronRepository
}

func NewNeuronsService(repo repository.NeuronRepository) *NeuronSyncService {
	return &NeuronSyncService{repo: repo}
}

func (s *NeuronSyncService) SyncNeurons(ctx context.Context, req NeuronHeartbeatRequest) (NeuronHeartbeatResponse, error) {
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
