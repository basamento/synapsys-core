package handler

import (
	"encoding/json"
	"net/http"
	"synapsys-core-go/backend/internal/repository"
)

type RegisterNeuronRequest struct {
	Name string `json:"name"`
}

func NeuronsHandler(repo *repository.NeuronRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		switch r.Method {

		case http.MethodPost:
			handleRegisterNeuron(w, r, repo)

		case http.MethodPut:
			handleHeartbeat(w, r, repo)

		case http.MethodGet:
			handleListNeurons(w, r, repo)

		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	}
}

func handleRegisterNeuron(w http.ResponseWriter, r *http.Request, repo *repository.NeuronRepository) {
	var req RegisterNeuronRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Missing 'name' field", http.StatusBadRequest)
		return
	}

	neuron, err := repo.CreateOrUpdate(req.Name)
	if err != nil {
		http.Error(w, "Failed to save neuron", http.StatusInternalServerError)
		return
	}

	resp := map[string]any{
		"id":              neuron.ID,
		"name":            neuron.Name,
		"status":          "registered",
		"created_at":      neuron.CreatedAt,
		"last_connection": neuron.LastConnection,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resp)
}

func handleListNeurons(w http.ResponseWriter, r *http.Request, repo *repository.NeuronRepository) {
	neurons, err := repo.ListAll()
	if err != nil {
		http.Error(w, "Failed to load neurons", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(neurons)
}

func handleHeartbeat(w http.ResponseWriter, r *http.Request, repo *repository.NeuronRepository) {
	var req RegisterNeuronRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Missing 'name' field", http.StatusBadRequest)
		return
	}

	if err := repo.TouchLastConnection(req.Name); err != nil {
		http.Error(w, "Failed to update heartbeat", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
