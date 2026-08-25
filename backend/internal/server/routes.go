package server

import (
	"net/http"
	"synapsys-core/internal/handler"
)

func RegisterHealth(mux *http.ServeMux, h *handler.HealthHandler) {
	mux.Handle("/api/health", h)
}

func RegisterNeurons(mux *http.ServeMux, h *handler.NeuronHandler) {
	mux.HandleFunc("POST /api/v1/workers/heartbeat", h.Sync)
	mux.HandleFunc("GET /api/neuron", h.ListAll)
	mux.HandleFunc("PUT /api/processes/{id}/desired-state", h.UpdateDesiredState)
}

func RegisterState(mux *http.ServeMux, h *handler.StateHandler) {
	mux.HandleFunc("GET /api/state", h.Get)
}
