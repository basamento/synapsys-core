package domain

import (
	"fmt"
	"time"
)

type NeuronType string
type NeuronState string
type NeuronStatus string

const (
	NeuronTypeEndless     NeuronType = "endless"
	NeuronTypeProgressive NeuronType = "progressive"
)

const (
	NeuronStateIdle     NeuronState = "idle"
	NeuronStateRunning  NeuronState = "running"
	NeuronStateStopping NeuronState = "stopping"
)

const (
	NeuronStatusActive   NeuronStatus = "active"
	NeuronStatusInactive NeuronStatus = "inactive"
)

func (t NeuronType) Valid() bool {
	return t == NeuronTypeEndless || t == NeuronTypeProgressive
}

func (s NeuronState) Valid() bool {
	return s == NeuronStateIdle || s == NeuronStateRunning || s == NeuronStateStopping
}

type Neuron struct {
	ID              int64
	Name            string
	ApplicationName string
	Type            NeuronType

	CurrentState NeuronState
	DesiredState NeuronState

	DesiredToken int64
	AckToken     int64
	DesiredRunID *int64

	LastTouch  time.Time
	PingTiming int
}

func (n Neuron) Validate() error {
	if n.Name == "" {
		return fmt.Errorf("name is required")
	}
	if n.ApplicationName == "" {
		return fmt.Errorf("application name is required")
	}
	if !n.Type.Valid() {
		return fmt.Errorf("invalid neuron type: %q", n.Type)
	}
	if !n.CurrentState.Valid() {
		return fmt.Errorf("invalid current state: %q", n.CurrentState)
	}
	if !n.DesiredState.Valid() {
		return fmt.Errorf("invalid desired state: %q", n.DesiredState)
	}
	if n.PingTiming <= 0 {
		return fmt.Errorf("ping timing must be positive")
	}
	if n.DesiredToken < 0 || n.AckToken < 0 {
		return fmt.Errorf("tokens must be >= 0")
	}
	return nil
}
