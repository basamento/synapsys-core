package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"strconv"
	"strings"
	"synapsys-core/internal/domain"
	"synapsys-core/internal/service"
	"time"
)

type NeuronHandler struct {
	service *service.NeuronService
}

type neuronHeartbeatRequestDTO struct {
	WorkerName        string          `json:"workerName"`
	Framework         string          `json:"framework"`
	Host              string          `json:"host"`
	HeartbeatInterval int             `json:"heartbeatInterval"`
	Processes         []neuronInfoDTO `json:"processes"`
	Logs              []processLogDTO `json:"logs"`
}

type processLogDTO struct {
	ProcessName string `json:"processName"`
	RunID       *int64 `json:"runId"`
	Sequence    *int64 `json:"sequence"`
	Timestamp   string `json:"timestamp"`
	Source      string `json:"source"`
	Level       string `json:"level"`
	Message     string `json:"message"`
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
	// Processes are addressed by id: names are only unique within a worker.
	processID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || processID <= 0 {
		http.Error(w, "invalid process id", http.StatusBadRequest)
		return
	}

	var dto service.UpdateDesiredStateRequest
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	dto.ProcessID = processID

	updated, err := h.service.UpdateDesiredState(r.Context(), dto)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if !updated {
		http.Error(w, "process not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func toSyncServiceRequest(dto neuronHeartbeatRequestDTO, remoteAddr string) (service.NeuronHeartbeatRequest, error) {
	processes := dto.Processes

	neurons := make([]service.NeuronHeartbeat, 0, len(processes))
	skipped := 0

	for _, n := range processes {
		// Normalize to lowercase to support Java enums RUNNING/IDLE/STOPPING etc.
		cs := domain.ExecutionState(strings.ToLower(n.CurrentState))
		nt := domain.ProcessType(strings.ToLower(n.Type))

		// One unreadable process must never cost us visibility of the whole
		// worker: skip it and keep the rest of the batch. This also keeps Core
		// forward-compatible with clients reporting states it does not know yet.
		if strings.TrimSpace(n.Name) == "" || !cs.Valid() || !nt.Valid() {
			skipped++
			log.Printf(
				"heartbeat: skipping process %q from worker %q (state=%q type=%q)",
				n.Name, dto.WorkerName, n.CurrentState, n.Type,
			)
			continue
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

	logs := make([]domain.ProcessLog, 0, len(dto.Logs))
	for _, entry := range dto.Logs {
		if strings.TrimSpace(entry.ProcessName) == "" || entry.RunID == nil || *entry.RunID <= 0 ||
			entry.Sequence == nil || *entry.Sequence <= 0 || strings.TrimSpace(entry.Message) == "" {
			return service.NeuronHeartbeatRequest{}, fmt.Errorf("invalid process log")
		}
		timestamp, err := time.Parse(time.RFC3339Nano, entry.Timestamp)
		if err != nil {
			return service.NeuronHeartbeatRequest{}, fmt.Errorf("invalid process log timestamp")
		}
		source := strings.ToLower(strings.TrimSpace(entry.Source))
		level := strings.ToLower(strings.TrimSpace(entry.Level))
		if source != "stdout" && source != "stderr" {
			return service.NeuronHeartbeatRequest{}, fmt.Errorf("invalid process log source")
		}
		if level != "info" && level != "error" {
			return service.NeuronHeartbeatRequest{}, fmt.Errorf("invalid process log level")
		}
		logs = append(logs, domain.ProcessLog{
			ProcessName: entry.ProcessName,
			RunID:       *entry.RunID,
			Sequence:    *entry.Sequence,
			Timestamp:   timestamp,
			Source:      source,
			Level:       level,
			Message:     entry.Message,
		})
	}

	if len(neurons) == 0 && skipped > 0 {
		return service.NeuronHeartbeatRequest{}, fmt.Errorf("no readable processes in heartbeat")
	}

	// A client that does not declare itself is unknown, not Java: defaulting to
	// springboot would silently mislabel every future Node/Python worker.
	framework := domain.WorkerFramework(strings.ToLower(dto.Framework))
	if framework == "" || !framework.Valid() {
		framework = domain.WorkerFrameworkUnknown
	}

	host := dto.Host
	if host == "" {
		host = remoteAddr
		if h, _, err := net.SplitHostPort(remoteAddr); err == nil {
			host = h
		}
	}

	heartbeatInterval := dto.HeartbeatInterval
	if heartbeatInterval <= 0 {
		return service.NeuronHeartbeatRequest{}, fmt.Errorf("heartbeatInterval must be a positive number of seconds")
	}

	return service.NeuronHeartbeatRequest{
		WorkerName:      dto.WorkerName,
		Framework:       framework,
		Host:            host,
		PingTiming:      heartbeatInterval,
		Neurons:         neurons,
		Logs:            logs,
	}, nil
}

func isWorkerHeartbeatPath(path string) bool {
	return path == "/api/v1/workers/heartbeat"
}

func toHeartbeatProcessesResponse(
	response service.NeuronHeartbeatResponse,
	request neuronHeartbeatRequestDTO,
) heartbeatProcessesResponseDTO {
	processByName := make(map[string]neuronInfoDTO, len(request.Processes))
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
