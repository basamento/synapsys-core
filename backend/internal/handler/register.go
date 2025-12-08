package handler

import (
	"encoding/json"
	"net/http"
)

type RegisterNeuronRequest struct {
	Name string `json:"name"`
}

func RegisterNeuronHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var req RegisterNeuronRequest

	// Parse JSON
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Missing 'name' field", http.StatusBadRequest)
		return
	}

	// TEMP: In the future we will save to DB
	// For now we return a simple success message

	resp := map[string]string{
		"status": "registered",
		"name":   req.Name,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated) // 201
	json.NewEncoder(w).Encode(resp)
}
