package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"synapsys-core-go/backend/internal/repository"
)

type RegisterNeuronRequest struct {
	Name       string `json:"name"`
	PingTiming int    `json:"ping_timing"`
}

type HeartBeatNeruonRequest struct {
	Name  string `json:"name"`
	State string `json:"state"` // "idle" | "running"
}

type NeuronHeartbeatResponse struct {
	DesiredState string `json:"desired_state"`
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

	neuron, err := repo.CreateOrUpdate(req.Name, req.PingTiming)
	if err != nil {
		http.Error(w, "Failed to save neuron", http.StatusInternalServerError)
		return
	}
	if req.PingTiming <= 0 {
		log.Printf(
			"[WARN] Invalid ping_timing received for neuron '%s': %d",
			req.Name,
			req.PingTiming,
		)
		http.Error(w, "Invalid 'ping_timing', must be > 0", http.StatusBadRequest)
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
	var req HeartBeatNeruonRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Missing 'name' field", http.StatusBadRequest)
		return
	}

	if req.State == "" {
		http.Error(w, "Missing 'state' field", http.StatusBadRequest)
		return
	}

	// in here if RequiredState = running and req.State = running -> RequiredState should go to idle

	desiredState, err := repo.Heartbeat(req.Name, req.State)
	if err != nil {
		http.Error(w, "Failed to process heartbeat", http.StatusInternalServerError)
		return
	}

	resp := NeuronHeartbeatResponse{
		DesiredState: desiredState,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func GetNeuronByIDHandler(repo *repository.NeuronRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		// Expected path: /api/neurons/{id}
		parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(parts) != 3 {
			http.Error(w, "Invalid neuron path", http.StatusBadRequest)
			return
		}

		id, err := strconv.ParseInt(parts[2], 10, 64)
		if err != nil {
			http.Error(w, "Invalid neuron id", http.StatusBadRequest)
			return
		}

		neuron, err := repo.GetByID(id)
		if err != nil {
			http.Error(w, "Failed to load neuron", http.StatusInternalServerError)
			return
		}
		if neuron == nil {
			http.Error(w, "Neuron not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(neuron)
	}
}

func handleStartNeuron(w http.ResponseWriter, r *http.Request, repo *repository.NeuronRepository) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/api/neurons/")
	idStr = strings.TrimSuffix(idStr, "/start")

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid neuron id", http.StatusBadRequest)
		return
	}

	if err := repo.SetDesiredStateByID(id, repository.DesiredRunning); err != nil {
		http.Error(w, "Failed to start neuron", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func NeuronByIDHandler(repo *repository.NeuronRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		// /api/neurons/{id} or /api/neurons/{id}/start
		path := strings.TrimPrefix(r.URL.Path, "/api/neurons/")
		parts := strings.Split(path, "/")

		if len(parts) < 1 {
			http.Error(w, "Invalid neuron path", http.StatusBadRequest)
			return
		}

		id, err := strconv.ParseInt(parts[0], 10, 64)
		if err != nil {
			http.Error(w, "Invalid neuron id", http.StatusBadRequest)
			return
		}

		// ---- /api/neurons/{id}
		if len(parts) == 1 {
			if r.Method != http.MethodGet {
				w.WriteHeader(http.StatusMethodNotAllowed)
				return
			}

			neuron, err := repo.GetByID(id)
			if err != nil {
				http.Error(w, "Failed to load neuron", http.StatusInternalServerError)
				return
			}
			if neuron == nil {
				http.Error(w, "Neuron not found", http.StatusNotFound)
				return
			}

			json.NewEncoder(w).Encode(neuron)
			return
		}

		// ---- /api/neurons/{id}/start
		if len(parts) == 2 && parts[1] == "start" {
			if r.Method != http.MethodPost {
				w.WriteHeader(http.StatusMethodNotAllowed)
				return
			}

			if err := repo.SetDesiredStateByID(id, repository.DesiredRunning); err != nil {
				http.Error(w, "Failed to start neuron", http.StatusInternalServerError)
				return
			}

			w.WriteHeader(http.StatusNoContent)
			return
		}

		http.Error(w, "Unknown neuron action", http.StatusNotFound)
	}
}
