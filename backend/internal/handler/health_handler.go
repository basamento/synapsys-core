package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"synapsys-core/internal/service"
)

type HealthHandler struct {
	service *service.HealthService
}

func NewHealthHandler(service *service.HealthService) *HealthHandler {
	return &HealthHandler{service: service}
}

func (h *HealthHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	result, err := h.service.Check(r.Context())
	status := http.StatusOK
	if err != nil {
		log.Printf("Health check failed: %v", err)
		status = http.StatusServiceUnavailable
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(result)
}
