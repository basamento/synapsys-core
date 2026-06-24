package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"strings"
	"synapsys-core/internal/domain"
	"synapsys-core/internal/service"
)

type NeuronHandler struct {
	service *service.NeuronService
}

type neuronHeartbeatRequestDTO struct {
	ApplicationName   string          `json:"applicationName"`
	WorkerName        string          `json:"workerName"`
	Framework         string          `json:"framework"`
	Host              string          `json:"host"`
	PingTiming        int             `json:"pingTiming"`
	HeartbeatInterval int             `json:"heartbeatInterval"`
	Neurons           []neuronInfoDTO `json:"neurons"`
	Processes         []neuronInfoDTO `json:"processes"`
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

type heartbeatProcessesResponseDTO struct {
	Processes []neuronInfoDTO `json:"processes"`
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
	req, err := toSyncServiceRequest(dto, r.RemoteAddr)
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
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	responseBody := any(response)
	if isWorkerHeartbeatPath(r.URL.Path) {
		responseBody = toHeartbeatProcessesResponse(response, dto)
	}
	if err := json.NewEncoder(w).Encode(responseBody); err != nil {
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

func toSyncServiceRequest(dto neuronHeartbeatRequestDTO, remoteAddr string) (service.NeuronHeartbeatRequest, error) {
	processes := dto.Processes
	if len(processes) == 0 {
		processes = dto.Neurons
	}

	neurons := make([]service.NeuronHeartbeat, 0, len(processes))

	for _, n := range processes {
		// Normalize to lowercase to support Java enums RUNNING/IDLE/STOPPING etc.
		cs := domain.ExecutionState(strings.ToLower(n.CurrentState))
		nt := domain.ProcessType(strings.ToLower(n.Type))

		if !cs.Valid() || !nt.Valid() {
			return service.NeuronHeartbeatRequest{}, fmt.Errorf("invalid process current state or type")
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

	framework := domain.WorkerFramework(strings.ToLower(dto.Framework))
	if framework == "" {
		framework = domain.WorkerFrameworkSpringBoot
	}
	if !framework.Valid() {
		return service.NeuronHeartbeatRequest{}, fmt.Errorf("invalid worker framework")
	}

	host := dto.Host
	if host == "" {
		host = remoteAddr
		if h, _, err := net.SplitHostPort(remoteAddr); err == nil {
			host = h
		}
	}

	heartbeatInterval := dto.HeartbeatInterval
	if heartbeatInterval == 0 {
		heartbeatInterval = dto.PingTiming
	}

	return service.NeuronHeartbeatRequest{
		ApplicationName: dto.ApplicationName,
		WorkerName:      dto.WorkerName,
		Framework:       framework,
		Host:            host,
		PingTiming:      heartbeatInterval,
		Neurons:         neurons,
	}, nil
}

func isWorkerHeartbeatPath(path string) bool {
	return path == "/api/v1/workers/heartbeat"
}

func toHeartbeatProcessesResponse(
	response service.NeuronHeartbeatResponse,
	request neuronHeartbeatRequestDTO,
) heartbeatProcessesResponseDTO {
	processByName := make(map[string]neuronInfoDTO, len(request.Processes)+len(request.Neurons))
	for _, process := range request.Neurons {
		processByName[process.Name] = process
	}
	for _, process := range request.Processes {
		processByName[process.Name] = process
	}

	processes := make([]neuronInfoDTO, 0, len(response.Neurons))
	for _, command := range response.Neurons {
		observed := processByName[command.Name]
		desiredToken := command.DesiredToken
		processes = append(processes, neuronInfoDTO{
			Name:         command.Name,
			Type:         string(command.Type),
			CurrentState: observed.CurrentState,
			DesiredState: string(command.DesiredState),
			DesiredToken: &desiredToken,
			RunId:        command.RunId,
			AckToken:     observed.AckToken,
		})
	}

	return heartbeatProcessesResponseDTO{Processes: processes}
}
