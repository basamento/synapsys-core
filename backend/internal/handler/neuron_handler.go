package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"synapsys-core/internal/domain"
	"synapsys-core/internal/service"
)

type NeuronHandler struct {
	service *service.NeuronService
}

type neuronHeartbeatRequestDTO struct {
	ApplicationName string          `json:"applicationName"`
	PingTiming      int             `json:"pingTiming"`
	Neurons         []neuronInfoDTO `json:"neurons"`
}

type neuronInfoDTO struct {
	Name         string `json:"name"`
	CurrentState string `json:"currentState"`
	DesiredState string `json:"desiredState"` // optional/debug
	Type         string `json:"type"`

	DesiredToken *int64 `json:"desiredToken,omitempty"` // optional/debug
	RunId        *int64 `json:"runId,omitempty"`        // optional/debug
	AckToken     *int64 `json:"ackToken,omitempty"`     // IMPORTANT (should be sent)
}

func NewNeuronHandler(service *service.NeuronService) *NeuronHandler {
	return &NeuronHandler{service: service}
}

func (h *NeuronHandler) ListAll(w http.ResponseWriter, r *http.Request) {
	resp, err := h.service.ListAllNeurons(r.Context())
	if err != nil {
		log.Printf("ListAllNeurons failed: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}

func (h *NeuronHandler) Sync(w http.ResponseWriter, r *http.Request) {
	// parse request body
	log.Printf("HTTP %s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)
	var dto neuronHeartbeatRequestDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	// parse to service request
	req, err := toSyncServiceRequest(dto)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	// call the service
	response, err := h.service.SyncNeurons(r.Context(), req)
	if err != nil {
		log.Printf("SyncNeurons failed: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	// return 200 and response body
	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}

func (h *NeuronHandler) UpdateDesiredState(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// If you're still sending JSON body, decode it here (but name is from path)
	var dto service.UpdateDesiredStateRequest
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	updated, err := h.service.UpdateDesiredState(r.Context(), dto)
	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	if !updated {
		http.Error(w, "neuron not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func toSyncServiceRequest(dto neuronHeartbeatRequestDTO) (service.NeuronHeartbeatRequest, error) {
	neurons := make([]service.NeuronHeartbeat, 0, len(dto.Neurons))

	for _, n := range dto.Neurons {
		// Normalize to lowercase to support Java enums RUNNING/IDLE/STOPPING etc.
		cs := domain.NeuronState(strings.ToLower(n.CurrentState))
		nt := domain.NeuronType(strings.ToLower(n.Type))

		if !cs.Valid() || !nt.Valid() {
			return service.NeuronHeartbeatRequest{}, fmt.Errorf("invalid neuron current state or type")
		}

		var ack int64 = 0
		if n.AckToken != nil {
			ack = *n.AckToken
		}

		neurons = append(neurons, service.NeuronHeartbeat{
			Name:         n.Name,
			Type:         nt,
			CurrentState: cs,
			AckToken:     ack,
		})
	}

	return service.NeuronHeartbeatRequest{
		ApplicationName: dto.ApplicationName,
		PingTiming:      dto.PingTiming,
		Neurons:         neurons,
	}, nil
}
