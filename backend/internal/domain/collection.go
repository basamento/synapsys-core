package domain

// Collection names one of the four listings /api/state returns. It is the
// prefix a client puts on every query parameter: processesPage, processesSort,
// processesState, and so on.
type Collection string

const (
	CollectionWorkers    Collection = "workers"
	CollectionProcesses  Collection = "processes"
	CollectionExecutions Collection = "executions"
	CollectionActions    Collection = "actions"
)

// Collections is the canonical order the four listings are handled in.
var Collections = []Collection{
	CollectionWorkers,
	CollectionProcesses,
	CollectionExecutions,
	CollectionActions,
}

// CollectionSchema is the public query contract for one listing: what its
// single filter facet is called, which values that facet accepts, and which
// columns it may be sorted by. The handler validates against this and the
// repository maps SortKeys onto SQL, so the two cannot drift apart.
type CollectionSchema struct {
	// FilterParam is the query-parameter suffix carrying the facet, e.g.
	// "State" for processesState. Empty means the collection has no facet.
	FilterParam string
	// FilterValues is the closed set the facet accepts.
	FilterValues []string
	// SortKeys is the closed set of logical column names.
	SortKeys []string
	// DefaultSortKey is applied when the client asks for no particular order.
	DefaultSortKey string
	// DefaultSortDir pairs with DefaultSortKey.
	DefaultSortDir SortDirection
}

// Accepts reports whether value is a member of the facet's closed set.
func (s CollectionSchema) Accepts(value string) bool {
	return contains(s.FilterValues, value)
}

// Sortable reports whether key names a column this collection can order by.
func (s CollectionSchema) Sortable(key string) bool {
	return contains(s.SortKeys, key)
}

// CollectionSchemas is the query contract for every listing, keyed by prefix.
var CollectionSchemas = map[Collection]CollectionSchema{
	CollectionWorkers: {
		FilterParam:    "Framework",
		FilterValues:   []string{"springboot", "nodejs", "python", "go", "unknown"},
		SortKeys:       []string{"name", "framework", "firstConnection", "lastConnection", "processes"},
		DefaultSortKey: "lastConnection",
		DefaultSortDir: SortDescending,
	},
	CollectionProcesses: {
		FilterParam:    "State",
		FilterValues:   []string{"idle", "running", "stopping", "failed"},
		SortKeys:       []string{"name", "type", "state", "framework", "lastTouch"},
		DefaultSortKey: "lastTouch",
		DefaultSortDir: SortDescending,
	},
	CollectionExecutions: {
		FilterParam:    "Status",
		FilterValues:   []string{"active", "inactive"},
		SortKeys:       []string{"id", "status", "current", "desired", "createdAt", "modifiedAt"},
		DefaultSortKey: "id",
		DefaultSortDir: SortDescending,
	},
	CollectionActions: {
		FilterParam:    "Type",
		FilterValues:   []string{"create", "start", "stop", "heartbeat", "ack"},
		SortKeys:       []string{"id", "type", "status", "execution", "createdAt"},
		DefaultSortKey: "createdAt",
		DefaultSortDir: SortDescending,
	},
}

func contains(values []string, value string) bool {
	for _, candidate := range values {
		if candidate == value {
			return true
		}
	}
	return false
}
