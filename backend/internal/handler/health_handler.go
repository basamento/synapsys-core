package handler

import (
	"encoding/json"
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
	result := h.service.Check(r.Context())
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(result)
}
