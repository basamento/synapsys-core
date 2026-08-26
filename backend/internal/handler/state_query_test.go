package handler

import (
	"net/url"
	"strings"
	"synapsys-core/internal/domain"
	"testing"
)

func TestParseStatePaginationDefaults(t *testing.T) {
	pagination, err := parseStatePagination(url.Values{})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	for name, query := range map[string]domain.CollectionQuery{
		"workers":    pagination.Workers,
		"processes":  pagination.Processes,
		"executions": pagination.Executions,
		"actions":    pagination.Actions,
	} {
		if query.Page != 1 || query.PageSize != 10 {
			t.Errorf("%s: expected page 1 size 10, got page %d size %d", name, query.Page, query.PageSize)
		}
		if query.Search != "" || len(query.Filters) != 0 {
			t.Errorf("%s: expected an unnarrowed query, got %+v", name, query)
		}
		if query.Filtered() {
			t.Errorf("%s: expected Filtered() to be false", name)
		}
	}

	if pagination.Processes.SortKey != "lastTouch" || pagination.Processes.SortDir != domain.SortDescending {
		t.Errorf("expected the processes default sort, got %q %q",
			pagination.Processes.SortKey, pagination.Processes.SortDir)
	}
}

func TestParseStatePaginationReadsEachCollectionIndependently(t *testing.T) {
	pagination, err := parseStatePagination(url.Values{
		"processesPage":   {"3"},
		"processesSearch": {"  endless  "},
		"processesState":  {"idle,running"},
		"processesSort":   {"name"},
		"processesDir":    {"asc"},
		"actionsPageSize": {"25"},
		"actionsType":     {"ack"},
	})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	processes := pagination.Processes
	if processes.Page != 3 {
		t.Errorf("expected page 3, got %d", processes.Page)
	}
	if processes.Search != "endless" {
		t.Errorf("expected the search term trimmed, got %q", processes.Search)
	}
	if len(processes.Filters) != 2 || processes.Filters[0] != "idle" || processes.Filters[1] != "running" {
		t.Errorf("expected [idle running], got %v", processes.Filters)
	}
	if processes.SortKey != "name" || processes.SortDir != domain.SortAscending {
		t.Errorf("expected name asc, got %q %q", processes.SortKey, processes.SortDir)
	}

	if pagination.Actions.PageSize != 25 || len(pagination.Actions.Filters) != 1 {
		t.Errorf("expected actions read independently, got %+v", pagination.Actions)
	}
	// Untouched collections keep their defaults.
	if pagination.Workers.Page != 1 || pagination.Workers.Search != "" {
		t.Errorf("expected workers to keep defaults, got %+v", pagination.Workers)
	}
}

func TestParseFilterQueryAcceptsRepeatedParamsAndDeduplicates(t *testing.T) {
	pagination, err := parseStatePagination(url.Values{
		"processesState": {"idle", "running,idle"},
	})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	filters := pagination.Processes.Filters
	if len(filters) != 2 || filters[0] != "idle" || filters[1] != "running" {
		t.Errorf("expected [idle running], got %v", filters)
	}
}

// Selecting every value narrows nothing, so it is normalised away and the
// repository can skip the IN clause entirely.
func TestParseFilterQueryDropsAFullSelection(t *testing.T) {
	pagination, err := parseStatePagination(url.Values{
		"processesState": {"idle,running,stopping,failed"},
	})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(pagination.Processes.Filters) != 0 {
		t.Errorf("expected a full selection to be dropped, got %v", pagination.Processes.Filters)
	}
	if pagination.Processes.Filtered() {
		t.Error("expected Filtered() to be false for a full selection")
	}
}

func TestParseStatePaginationRejectsBadInput(t *testing.T) {
	cases := map[string]url.Values{
		"unknown filter value": {"processesState": {"exploded"}},
		"unknown sort key":     {"processesSort": {"password"}},
		"unknown direction":    {"processesDir": {"sideways"}},
		"page zero":            {"workersPage": {"0"}},
		"page not a number":    {"workersPage": {"two"}},
		"page size over cap":   {"actionsPageSize": {"101"}},
		"search too long":      {"actionsSearch": {strings.Repeat("x", maxSearchLength+1)}},
	}

	for name, values := range cases {
		if _, err := parseStatePagination(values); err == nil {
			t.Errorf("%s: expected an error, got none", name)
		}
	}
}

// Every sort key and filter value the schema advertises must actually parse,
// or the console could offer a control the API rejects.
func TestEverySchemaValueIsAccepted(t *testing.T) {
	for collection, schema := range domain.CollectionSchemas {
		prefix := string(collection)

		for _, key := range schema.SortKeys {
			values := url.Values{prefix + "Sort": {key}}
			if _, err := parseStatePagination(values); err != nil {
				t.Errorf("%s: sort key %q rejected: %v", collection, key, err)
			}
		}

		for _, value := range schema.FilterValues {
			values := url.Values{prefix + schema.FilterParam: {value}}
			if _, err := parseStatePagination(values); err != nil {
				t.Errorf("%s: filter value %q rejected: %v", collection, value, err)
			}
		}

		if !schema.Sortable(schema.DefaultSortKey) {
			t.Errorf("%s: default sort key %q is not in SortKeys", collection, schema.DefaultSortKey)
		}
		if !schema.DefaultSortDir.Valid() {
			t.Errorf("%s: default sort direction %q is invalid", collection, schema.DefaultSortDir)
		}
	}
}
