package router

import (
	"net/http"

	"synapsys-core-go/backend/internal/handler"
	"synapsys-core-go/backend/internal/repository"
)

func New(repo *repository.NeuronRepository) *http.ServeMux {
	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("/api/test", handler.TestHandler)
	mux.HandleFunc("/api/neurons", handler.NeuronsHandler(repo))

	return mux
}
