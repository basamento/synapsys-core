package router

import (
	"net/http"

	"synapsys-core-go/backend/internal/handler"
)

func New() *http.ServeMux {
	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("/api/test", handler.TestHandler)
	mux.HandleFunc("/api/register", handler.RegisterNeuronHandler)

	return mux
}
