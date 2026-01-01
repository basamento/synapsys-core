package domain

import (
	"fmt"
	"time"
)

// NeuronType the type of the neuron execution
type NeuronType string

// NeuronState the last registered state of the neuron
type NeuronState string

// NeuronStatus active or inactive
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

// Neuron main entity
type Neuron struct {
	ID              int64
	Name            string
	ApplicationName string
	Type            NeuronType
	CurrentState    NeuronState
	DesiredState    NeuronState
	LastTouch       time.Time
	PingTiming      int
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
		return fmt.Errorf("invalid neuron state: %q", n.CurrentState)
	}
	if n.PingTiming <= 0 {
		return fmt.Errorf("ping timing must be positive")
	}
	return nil
}
