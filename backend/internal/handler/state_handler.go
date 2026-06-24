package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"synapsys-core/internal/service"
)

type StateHandler struct {
	service *service.StateService
}

func NewStateHandler(service *service.StateService) *StateHandler {
	return &StateHandler{service: service}
}

func (h *StateHandler) Get(w http.ResponseWriter, r *http.Request) {
	log.Printf("HTTP %s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)

	resp, err := h.service.GetState(r.Context())
	if err != nil {
		log.Printf("GetState failed: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	log.Printf(
		"State snapshot returned workers=%d processes=%d executions=%d actions=%d",
		len(resp.Workers),
		len(resp.Processes),
		len(resp.Executions),
		len(resp.Actions),
	)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}
