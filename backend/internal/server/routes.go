package server

import (
	"net/http"
	"synapsys-core/internal/handler"
)

func RegisterHealth(mux *http.ServeMux, h *handler.HealthHandler) {
	mux.Handle("/api/health", h)
}

func RegisterNeurons(mux *http.ServeMux, h *handler.NeuronHandler) {
	mux.HandleFunc("POST /api/neuron", h.Sync)
	mux.HandleFunc("GET /api/neuron", h.ListAll)
	mux.HandleFunc("PUT /api/neuron", h.UpdateDesiredState)
}
