package domain

import "strings"

// SortDirection is the direction a listing is ordered in. Only two values exist;
// anything else the client sends is rejected at the handler.
type SortDirection string

const (
	SortAscending  SortDirection = "asc"
	SortDescending SortDirection = "desc"
)

func (d SortDirection) Valid() bool {
	return d == SortAscending || d == SortDescending
}

// CollectionQuery is everything a client can ask of one listing: which slice of
// it to return, which rows to keep, and how to order them.
//
// Every collection has exactly one filter facet — state for processes,
// framework for workers, status for executions, type for actions — so Filters
// needs no facet name. SortKey is a logical column name, not SQL: the
// repository maps it through an allowlist before it reaches a query.
type CollectionQuery struct {
	Page     int
	PageSize int
	Search   string
	Filters  []string
	SortKey  string
	SortDir  SortDirection
}

// Filtered reports whether the query narrows the collection at all. A page that
// is only paginated can take the cheaper unfiltered count.
func (q CollectionQuery) Filtered() bool {
	return strings.TrimSpace(q.Search) != "" || len(q.Filters) > 0
}

type CollectionPagination = CollectionQuery

type PageInfo struct {
	Page       int
	PageSize   int
	TotalItems int
	TotalPages int
}

type StatePagination struct {
	Workers    CollectionQuery
	Processes  CollectionQuery
	Executions CollectionQuery
	Actions    CollectionQuery
}

type StatePageInfo struct {
	Workers    PageInfo
	Processes  PageInfo
	Executions PageInfo
	Actions    PageInfo
}

type StateSnapshot struct {
	Workers      []Worker
	Processes    []Process
	Executions   []Execution
	Actions      []Action
	ProcessViews []ProcessView
	Pagination   StatePageInfo
}
