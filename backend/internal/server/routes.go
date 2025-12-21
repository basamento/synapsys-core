package server

import (
	"net/http"
	"synapsys-core/internal/handler"
)

func RegisterHealth(mux *http.ServeMux, h *handler.HealthHandler) {
	mux.Handle("/api/health", h)
}

func RegisterNeurons(mux *http.ServeMux, h *handler.NeuronHandler) {
	mux.Handle("/api/neuron", handler.Method(http.MethodPost, h))
}
