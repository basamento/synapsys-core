package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"synapsys-core/internal/service"
)

type LogHandler struct {
	service *service.LogService
}

func NewLogHandler(service *service.LogService) *LogHandler {
	return &LogHandler{service: service}
}

func (h *LogHandler) ListExecutionLogs(w http.ResponseWriter, r *http.Request) {
	executionID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || executionID <= 0 {
		http.Error(w, "invalid execution id", http.StatusBadRequest)
		return
	}
	after, err := parseNonNegativeQuery(r, "after")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	limit := 500
	if raw := r.URL.Query().Get("limit"); raw != "" {
		limit, err = strconv.Atoi(raw)
		if err != nil || limit <= 0 || limit > 1000 {
			http.Error(w, "limit must be between 1 and 1000", http.StatusBadRequest)
			return
		}
	}

	logs, err := h.service.ListExecutionLogs(r.Context(), executionID, after, limit)
	if err != nil {
		http.Error(w, "unable to load execution logs", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"executionId": executionID,
		"logs":        logs,
	})
}

func parseNonNegativeQuery(r *http.Request, name string) (int64, error) {
	raw := r.URL.Query().Get(name)
	if raw == "" {
		return 0, nil
	}
	value, err := strconv.ParseInt(raw, 10, 64)
	if err != nil || value < 0 {
		return 0, &queryError{name: name}
	}
	return value, nil
}

type queryError struct{ name string }

func (e *queryError) Error() string { return e.name + " must be a non-negative integer" }
