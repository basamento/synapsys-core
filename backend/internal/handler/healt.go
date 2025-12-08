package handler

import (
	"encoding/json"
	"net/http"
)

// Response model
type HealthResponse struct {
	Status string `json:"status"`
}

// GET /api/test
func TestHandler(w http.ResponseWriter, r *http.Request) {
	resp := HealthResponse{Status: "ok"}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(resp)
}
