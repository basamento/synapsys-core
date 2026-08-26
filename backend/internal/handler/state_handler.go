package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"synapsys-core/internal/domain"
	"synapsys-core/internal/service"
)

// maxPageSize caps how much one poll can pull back. The console offers 10/25/50.
const maxPageSize = 100

// maxSearchLength bounds the LIKE term so a pathological query cannot turn a
// 5-second poll into a table scan with a megabyte pattern.
const maxSearchLength = 200

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
	queries := make(map[domain.Collection]domain.CollectionQuery, len(domain.Collections))
	for _, collection := range domain.Collections {
		query, err := parseCollectionQuery(values, collection)
		if err != nil {
			return domain.StatePagination{}, err
		}
		queries[collection] = query
	}

	return domain.StatePagination{
		Workers:    queries[domain.CollectionWorkers],
		Processes:  queries[domain.CollectionProcesses],
		Executions: queries[domain.CollectionExecutions],
		Actions:    queries[domain.CollectionActions],
	}, nil
}

// parseCollectionQuery reads one listing's slice of the query string. Every
// parameter is prefixed with the collection name, so the four listings can be
// paged, searched and sorted independently in a single request.
func parseCollectionQuery(values url.Values, collection domain.Collection) (domain.CollectionQuery, error) {
	prefix := string(collection)
	schema := domain.CollectionSchemas[collection]

	page, err := parsePositiveIntQuery(values, prefix+"Page", 1)
	if err != nil {
		return domain.CollectionQuery{}, err
	}

	pageSize, err := parsePositiveIntQuery(values, prefix+"PageSize", 10)
	if err != nil {
		return domain.CollectionQuery{}, err
	}
	if pageSize > maxPageSize {
		return domain.CollectionQuery{}, fmt.Errorf("%sPageSize must be <= %d", prefix, maxPageSize)
	}

	search := strings.TrimSpace(values.Get(prefix + "Search"))
	if len(search) > maxSearchLength {
		return domain.CollectionQuery{}, fmt.Errorf("%sSearch must be <= %d characters", prefix, maxSearchLength)
	}

	filters, err := parseFilterQuery(values, prefix, schema)
	if err != nil {
		return domain.CollectionQuery{}, err
	}

	sortKey, sortDir, err := parseSortQuery(values, prefix, schema)
	if err != nil {
		return domain.CollectionQuery{}, err
	}

	return domain.CollectionQuery{
		Page:     page,
		PageSize: pageSize,
		Search:   search,
		Filters:  filters,
		SortKey:  sortKey,
		SortDir:  sortDir,
	}, nil
}

// parseFilterQuery reads the collection's one facet. Values arrive either
// comma-separated or as repeated parameters; both spellings mean the same set.
// Selecting every value is equivalent to selecting none, so it is normalised
// away and the repository can skip the IN clause entirely.
func parseFilterQuery(values url.Values, prefix string, schema domain.CollectionSchema) ([]string, error) {
	if schema.FilterParam == "" {
		return nil, nil
	}

	key := prefix + schema.FilterParam
	seen := make(map[string]bool, len(schema.FilterValues))
	filters := make([]string, 0, len(schema.FilterValues))

	for _, raw := range values[key] {
		for _, value := range strings.Split(raw, ",") {
			value = strings.TrimSpace(value)
			if value == "" {
				continue
			}
			if !schema.Accepts(value) {
				return nil, fmt.Errorf(
					"%s must be one of %s",
					key,
					strings.Join(schema.FilterValues, ", "),
				)
			}
			if !seen[value] {
				seen[value] = true
				filters = append(filters, value)
			}
		}
	}

	if len(filters) == len(schema.FilterValues) {
		return nil, nil
	}
	return filters, nil
}

func parseSortQuery(
	values url.Values,
	prefix string,
	schema domain.CollectionSchema,
) (string, domain.SortDirection, error) {
	sortKey := strings.TrimSpace(values.Get(prefix + "Sort"))
	if sortKey == "" {
		sortKey = schema.DefaultSortKey
	} else if !schema.Sortable(sortKey) {
		return "", "", fmt.Errorf(
			"%sSort must be one of %s",
			prefix,
			strings.Join(schema.SortKeys, ", "),
		)
	}

	sortDir := domain.SortDirection(strings.TrimSpace(values.Get(prefix + "Dir")))
	if sortDir == "" {
		sortDir = schema.DefaultSortDir
	} else if !sortDir.Valid() {
		return "", "", fmt.Errorf("%sDir must be asc or desc", prefix)
	}

	return sortKey, sortDir, nil
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
