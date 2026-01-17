package service

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"strings"
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
	DesiredToken    int64     `json:"desiredToken"`
	AckToken        int64     `json:"ackToken"`
	RunId           *int64    `json:"runId,omitempty"`
	Status          string    `json:"status"`
	LastTouch       time.Time `json:"lastTouch"`
	PingTiming      int       `json:"pingTiming"`
}

type NeuronHeartbeat struct {
	Name         string             `json:"name"`
	Type         domain.NeuronType  `json:"type"`
	CurrentState domain.NeuronState `json:"currentState"`
	AckToken     int64              `json:"ackToken"`
}

type NeuronCommand struct {
	Name         string             `json:"name"`
	Type         domain.NeuronType  `json:"type"`
	DesiredState domain.NeuronState `json:"desiredState"`
	DesiredToken int64              `json:"desiredToken"`
	RunId        *int64             `json:"runId,omitempty"`
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
	Neurons []NeuronCommand `json:"neurons"`
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

	observations := make([]domain.Neuron, 0, len(req.Neurons))
	names := make([]string, 0, len(req.Neurons))

	for _, hb := range req.Neurons {
		n := domain.Neuron{
			Name:            hb.Name,
			ApplicationName: req.ApplicationName,
			Type:            hb.Type,

			CurrentState: hb.CurrentState,
			AckToken:     hb.AckToken,

			// For inserts: desired defaults
			DesiredState: domain.NeuronStateIdle,
			DesiredToken: 0,
			DesiredRunID: nil,

			LastTouch:  now,
			PingTiming: req.PingTiming,
		}
		if err := n.Validate(); err != nil {
			return NeuronHeartbeatResponse{}, err
		}
		observations = append(observations, n)
		names = append(names, hb.Name)
	}

	var dbNeurons []domain.Neuron

	err := s.repo.WithTx(ctx, func(tx *sql.Tx) error {
		// 1) upsert observations (does NOT overwrite desired command fields)
		if err := s.repo.BatchUpsert(ctx, observations); err != nil {
			return err
		}
		// 2) cleanup desired_state for progressive runs that have been acked
		if err := s.repo.ApplyDesiredCleanup(ctx, req.ApplicationName, names); err != nil {
			return err
		}
		// 3) fetch back desired commands to return
		var err error
		dbNeurons, err = s.repo.GetByNames(ctx, req.ApplicationName, names)
		return err
	})

	if err != nil {
		return NeuronHeartbeatResponse{}, err
	}

	resp := make([]NeuronCommand, 0, len(dbNeurons))
	for _, n := range dbNeurons {
		resp = append(resp, NeuronCommand{
			Name:         n.Name,
			Type:         n.Type,
			DesiredState: n.DesiredState,
			DesiredToken: n.DesiredToken,
			RunId:        n.DesiredRunID,
		})
	}

	return NeuronHeartbeatResponse{Neurons: resp}, nil
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
	// normalize
	state := domain.NeuronState(strings.ToLower(string(req.DesiredState)))
	if !state.Valid() {
		return false, fmt.Errorf("invalid desired state")
	}
	// Backward compatibility: if someone still sends IDLE to mean stop,
	// interpret it as STOPPING (explicit stop command).
	if state == domain.NeuronStateIdle {
		state = domain.NeuronStateStopping
	}
	var runID *int64
	if state == domain.NeuronStateRunning {
		// core generates runID; repo applies it only if neuron is progressive
		id := time.Now().UnixNano()
		runID = &id
	}
	return s.repo.UpdateDesiredCommand(ctx, req.NeuronName, state, runID)
}

func toNeuronDTO(n domain.Neuron, now time.Time) NeuronDTO {
	var status domain.NeuronStatus
	duration := now.Sub(n.LastTouch)
	inactive := duration > time.Duration(n.PingTiming)*time.Millisecond

	if inactive {
		status = domain.NeuronStatusInactive
	} else {
		status = domain.NeuronStatusActive
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

		DesiredToken: n.DesiredToken,
		AckToken:     n.AckToken,
		RunId:        n.DesiredRunID,
	}
}
