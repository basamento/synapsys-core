package sqlite

import (
	"fmt"
	"strings"
	"synapsys-core/internal/domain"
)

// listingSpec is the SQL half of a collection's query contract. domain.
// CollectionSchemas says what a client may ask for; this says what that turns
// into. Search, filter and sort are all built from these fields, so a listing
// gains a sortable column by adding one entry to sortCols and one to the
// schema's SortKeys — never by hand-writing another query.
//
// Nothing from the client reaches SQL as text: search and filter values become
// bound parameters, and sort keys are looked up in sortCols, so an unmapped key
// yields no ORDER BY fragment rather than an injected one.
type listingSpec struct {
	// from is the FROM clause including any joins, with table aliases.
	from string
	// baseWhere is a predicate applied to every query on this collection,
	// independent of what the client asked for.
	baseWhere string
	// searchCols are matched case-insensitively against the search term.
	// Non-text columns must be cast, e.g. CAST(a.id AS TEXT).
	searchCols []string
	// filterCol is the column the collection's one facet narrows.
	filterCol string
	// sortCols maps a schema SortKey onto a SQL expression.
	sortCols map[string]string
	// tieBreak keeps ordering stable across polls when the sort column ties.
	tieBreak string
}

var listingSpecs = map[domain.Collection]listingSpec{
	domain.CollectionWorkers: {
		from:       "workers w",
		searchCols: []string{"w.name", "w.host"},
		filterCol:  "w.framework",
		sortCols: map[string]string{
			"name":            "w.name",
			"framework":       "w.framework",
			"firstConnection": "w.first_connection",
			"lastConnection":  "w.last_connection",
			"processes":       workerProcessCount,
		},
		tieBreak: "w.name ASC",
	},

	// Processes are listed through their worker and their latest execution:
	// the console's Processes view shows all three together, and the state
	// facet lives on the execution.
	domain.CollectionProcesses: {
		from: `processes p
		INNER JOIN workers w ON w.id = p.worker_id
		INNER JOIN executions e ON e.id = (
			SELECT e2.id
			FROM executions e2
			WHERE e2.process_id = p.id
			ORDER BY e2.id DESC
			LIMIT 1
		)`,
		searchCols: []string{"p.name", "w.name", "w.host"},
		filterCol:  "e.current_status",
		sortCols: map[string]string{
			"name":      "p.name",
			"type":      "p.type",
			"state":     "e.current_status",
			"framework": "w.framework",
			"lastTouch": "w.last_touch",
		},
		tieBreak: "p.id DESC",
	},

	domain.CollectionExecutions: {
		from: "executions e",
		// The no-run-id row is an internal process-state baseline created when
		// a process is first discovered. Public execution history is runs only.
		baseWhere:  "e.run_id IS NOT NULL",
		searchCols: []string{"CAST(e.id AS TEXT)", "CAST(e.process_id AS TEXT)", "CAST(e.run_id AS TEXT)"},
		filterCol:  "e.status",
		sortCols: map[string]string{
			"id":         "e.id",
			"status":     "e.status",
			"current":    "e.current_status",
			"desired":    "e.desired_state",
			"createdAt":  "e.created_at",
			"modifiedAt": "e.modified_at",
		},
		tieBreak: "e.id DESC",
	},

	domain.CollectionActions: {
		from:       "actions a",
		searchCols: []string{"CAST(a.id AS TEXT)", "CAST(a.execution_id AS TEXT)", "a.type"},
		filterCol:  "a.type",
		sortCols: map[string]string{
			"id":        "a.id",
			"type":      "a.type",
			"status":    "a.status",
			"execution": "a.execution_id",
			"createdAt": "a.created_at",
		},
		tieBreak: "a.id DESC",
	},
}

// workerProcessCount is both a selected column and a sort target, so it lives
// in one constant rather than being spelled out twice.
const workerProcessCount = "(SELECT COUNT(*) FROM processes p WHERE p.worker_id = w.id)"

// where builds the predicate for a query along with its bound arguments.
// Returns an empty string when nothing narrows the collection.
func (s listingSpec) where(query domain.CollectionQuery) (string, []any) {
	var clauses []string
	var args []any

	if s.baseWhere != "" {
		clauses = append(clauses, s.baseWhere)
	}

	if term := strings.TrimSpace(query.Search); term != "" && len(s.searchCols) > 0 {
		pattern := "%" + escapeLikePattern(term) + "%"
		matches := make([]string, 0, len(s.searchCols))
		for _, col := range s.searchCols {
			matches = append(matches, col+" LIKE ? ESCAPE '\\'")
			args = append(args, pattern)
		}
		clauses = append(clauses, "("+strings.Join(matches, " OR ")+")")
	}

	if len(query.Filters) > 0 && s.filterCol != "" {
		placeholders := strings.TrimSuffix(strings.Repeat("?, ", len(query.Filters)), ", ")
		clauses = append(clauses, fmt.Sprintf("%s IN (%s)", s.filterCol, placeholders))
		for _, filter := range query.Filters {
			args = append(args, filter)
		}
	}

	if len(clauses) == 0 {
		return "", nil
	}
	return "WHERE " + strings.Join(clauses, " AND "), args
}

// orderBy resolves the client's sort key through sortCols. An unknown key
// cannot reach SQL: it simply leaves the tie-break as the only ordering.
func (s listingSpec) orderBy(query domain.CollectionQuery) string {
	terms := make([]string, 0, 2)

	if column, ok := s.sortCols[query.SortKey]; ok {
		direction := "ASC"
		if query.SortDir == domain.SortDescending {
			direction = "DESC"
		}
		terms = append(terms, column+" "+direction)
	}
	if s.tieBreak != "" {
		terms = append(terms, s.tieBreak)
	}

	if len(terms) == 0 {
		return ""
	}
	return "ORDER BY " + strings.Join(terms, ", ")
}

// selectPage assembles the full statement for one page and its arguments.
// The LIMIT/OFFSET parameters are appended after the WHERE arguments so the
// caller can pass the result straight to QueryContext.
func (s listingSpec) selectPage(columns string, query domain.CollectionQuery, page domain.PageInfo) (string, []any) {
	where, args := s.where(query)

	statement := fmt.Sprintf(
		"SELECT %s FROM %s %s %s LIMIT ? OFFSET ?",
		columns,
		s.from,
		where,
		s.orderBy(query),
	)
	return statement, append(args, page.PageSize, pageOffset(page))
}

// selectCount assembles the total-rows statement, which must apply exactly the
// same predicate as selectPage or the pager would lie.
func (s listingSpec) selectCount(query domain.CollectionQuery) (string, []any) {
	where, args := s.where(query)
	return fmt.Sprintf("SELECT COUNT(*) FROM %s %s", s.from, where), args
}

// escapeLikePattern neutralises the wildcards a search term may contain, so
// typing "100%" looks for that literal text instead of matching everything.
func escapeLikePattern(term string) string {
	replacer := strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)
	return replacer.Replace(term)
}
