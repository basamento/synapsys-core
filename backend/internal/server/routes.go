package server

import (
	"net/http"
	"synapsys-core/internal/handler"
)

type Middleware func(http.Handler) http.Handler

func RegisterHealth(mux *http.ServeMux, h *handler.HealthHandler) {
	mux.Handle("/api/health", h)
}

func RegisterNeurons(mux *http.ServeMux, h *handler.NeuronHandler, requireUI Middleware, requireWorker Middleware) {
	mux.Handle("POST /api/v1/workers/heartbeat", requireWorker(http.HandlerFunc(h.Sync)))
	mux.Handle("GET /api/neuron", requireUI(http.HandlerFunc(h.ListAll)))
	mux.Handle("PUT /api/processes/{id}/desired-state", requireUI(http.HandlerFunc(h.UpdateDesiredState)))
}

func RegisterState(mux *http.ServeMux, h *handler.StateHandler, requireUI Middleware) {
	mux.Handle("GET /api/state", requireUI(http.HandlerFunc(h.Get)))
}

func RegisterLogs(mux *http.ServeMux, h *handler.LogHandler, requireUI Middleware) {
	mux.Handle("GET /api/executions/{id}/logs", requireUI(http.HandlerFunc(h.ListExecutionLogs)))
}
