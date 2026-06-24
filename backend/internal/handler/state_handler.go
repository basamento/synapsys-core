package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"synapsys-core/internal/domain"
	"synapsys-core/internal/service"
)

type StateHandler struct {
	service *service.StateService
}

func NewStateHandler(service *service.StateService) *StateHandler {
	return &StateHandler{service: service}
}

func (h *StateHandler) Get(w http.ResponseWriter, r *http.Request) {
	log.Printf("HTTP %s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)

	pagination, err := parseStatePagination(r.URL.Query())
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	resp, err := h.service.GetState(r.Context(), pagination)
	if err != nil {
		log.Printf("GetState failed: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	log.Printf(
		"State snapshot returned workers=%d processes=%d executions=%d actions=%d",
		len(resp.Workers),
		len(resp.Processes),
		len(resp.Executions),
		len(resp.Actions),
	)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}

func parseStatePagination(values url.Values) (domain.StatePagination, error) {
	workers, err := parseCollectionPagination(values, "workers")
	if err != nil {
		return domain.StatePagination{}, err
	}
	processes, err := parseCollectionPagination(values, "processes")
	if err != nil {
		return domain.StatePagination{}, err
	}
	executions, err := parseCollectionPagination(values, "executions")
	if err != nil {
		return domain.StatePagination{}, err
	}
	actions, err := parseCollectionPagination(values, "actions")
	if err != nil {
		return domain.StatePagination{}, err
	}

	return domain.StatePagination{
		Workers:    workers,
		Processes:  processes,
		Executions: executions,
		Actions:    actions,
	}, nil
}

func parseCollectionPagination(values url.Values, collection string) (domain.CollectionPagination, error) {
	page, err := parsePositiveIntQuery(values, collection+"Page", 1)
	if err != nil {
		return domain.CollectionPagination{}, err
	}
	pageSize, err := parsePositiveIntQuery(values, collection+"PageSize", 10)
	if err != nil {
		return domain.CollectionPagination{}, err
	}
	if pageSize > 100 {
		return domain.CollectionPagination{}, fmt.Errorf("%sPageSize must be <= 100", collection)
	}
	return domain.CollectionPagination{Page: page, PageSize: pageSize}, nil
}

func parsePositiveIntQuery(values url.Values, key string, defaultValue int) (int, error) {
	raw := values.Get(key)
	if raw == "" {
		return defaultValue, nil
	}

	value, err := strconv.Atoi(raw)
	if err != nil || value <= 0 {
		return 0, fmt.Errorf("%s must be a positive integer", key)
	}
	return value, nil
}
