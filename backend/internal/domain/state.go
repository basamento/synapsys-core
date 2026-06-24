package domain

type CollectionPagination struct {
	Page     int
	PageSize int
}

type PageInfo struct {
	Page       int
	PageSize   int
	TotalItems int
	TotalPages int
}

type StatePagination struct {
	Workers    CollectionPagination
	Processes  CollectionPagination
	Executions CollectionPagination
	Actions    CollectionPagination
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
