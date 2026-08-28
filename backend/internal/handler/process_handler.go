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

type ProcessHandler struct {
	service *service.ProcessService
}

type heartbeatRequestDTO struct {
	WorkerName        string           `json:"workerName"`
	Framework         string           `json:"framework"`
	Host              string           `json:"host"`
	HeartbeatInterval int              `json:"heartbeatInterval"`
	Processes         []processInfoDTO `json:"processes"`
	Logs              []processLogDTO  `json:"logs"`
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

type processInfoDTO struct {
	Name         string `json:"name"`
	CurrentState string `json:"currentState"`
	DesiredState string `json:"desiredState"` // optional/debug
	Type         string `json:"type"`

	DesiredToken *int64 `json:"desiredToken,omitempty"` // optional/debug
	RunId        *int64 `json:"runId,omitempty"`        // optional/debug
	AckToken     *int64 `json:"ackToken,omitempty"`     // IMPORTANT (should be sent)
}

type heartbeatProcessesResponseDTO struct {
	Processes []processInfoDTO `json:"processes"`
}

func NewProcessHandler(service *service.ProcessService) *ProcessHandler {
	return &ProcessHandler{service: service}
}

func (h *ProcessHandler) ListAll(w http.ResponseWriter, r *http.Request) {
	resp, err := h.service.ListAllProcesses(r.Context())
	if err != nil {
		log.Printf("ListAllProcesses failed: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}

func (h *ProcessHandler) Sync(w http.ResponseWriter, r *http.Request) {
	// parse request body
	log.Printf("HTTP %s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)
	var dto heartbeatRequestDTO
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
	response, err := h.service.SyncProcesses(r.Context(), req)
	if err != nil {
		log.Printf("SyncProcesses failed: %v", err)
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

func (h *ProcessHandler) UpdateDesiredState(w http.ResponseWriter, r *http.Request) {
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

func toSyncServiceRequest(dto heartbeatRequestDTO, remoteAddr string) (service.HeartbeatRequest, error) {
	reported := dto.Processes

	processes := make([]service.ProcessHeartbeat, 0, len(reported))
	skipped := 0

	for _, n := range reported {
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

		processes = append(processes, service.ProcessHeartbeat{
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
			return service.HeartbeatRequest{}, fmt.Errorf("invalid process log")
		}
		timestamp, err := time.Parse(time.RFC3339Nano, entry.Timestamp)
		if err != nil {
			return service.HeartbeatRequest{}, fmt.Errorf("invalid process log timestamp")
		}
		source := strings.ToLower(strings.TrimSpace(entry.Source))
		level := strings.ToLower(strings.TrimSpace(entry.Level))
		if source != "stdout" && source != "stderr" {
			return service.HeartbeatRequest{}, fmt.Errorf("invalid process log source")
		}
		if level != "info" && level != "error" {
			return service.HeartbeatRequest{}, fmt.Errorf("invalid process log level")
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

	if len(processes) == 0 && skipped > 0 {
		return service.HeartbeatRequest{}, fmt.Errorf("no readable processes in heartbeat")
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
		return service.HeartbeatRequest{}, fmt.Errorf("heartbeatInterval must be a positive number of seconds")
	}

	return service.HeartbeatRequest{
		WorkerName: dto.WorkerName,
		Framework:  framework,
		Host:       host,
		PingTiming: heartbeatInterval,
		Processes:  processes,
		Logs:       logs,
	}, nil
}

func isWorkerHeartbeatPath(path string) bool {
	return path == "/api/v1/workers/heartbeat"
}

func toHeartbeatProcessesResponse(
	response service.HeartbeatResponse,
	request heartbeatRequestDTO,
) heartbeatProcessesResponseDTO {
	processByName := make(map[string]processInfoDTO, len(request.Processes))
	for _, process := range request.Processes {
		processByName[process.Name] = process
	}

	processes := make([]processInfoDTO, 0, len(response.Processes))
	for _, command := range response.Processes {
		observed := processByName[command.Name]
		desiredToken := command.DesiredToken
		processes = append(processes, processInfoDTO{
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
