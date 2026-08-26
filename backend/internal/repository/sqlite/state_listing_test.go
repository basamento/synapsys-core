package sqlite

import (
	"strings"
	"synapsys-core/internal/domain"
	"testing"
)

func TestWhereIsEmptyForAnUnnarrowedQuery(t *testing.T) {
	spec := listingSpecs[domain.CollectionActions]

	where, args := spec.where(domain.CollectionQuery{})
	if where != "" || len(args) != 0 {
		t.Errorf("expected no predicate, got %q with %v", where, args)
	}
}

// The executions listing hides the internal baseline row, and that predicate
// must survive whether or not the client narrows anything.
func TestWhereAlwaysKeepsTheBasePredicate(t *testing.T) {
	spec := listingSpecs[domain.CollectionExecutions]

	for name, query := range map[string]domain.CollectionQuery{
		"unnarrowed": {},
		"searched":   {Search: "12"},
		"filtered":   {Filters: []string{"active"}},
	} {
		where, _ := spec.where(query)
		if !strings.Contains(where, "e.run_id IS NOT NULL") {
			t.Errorf("%s: expected the base predicate, got %q", name, where)
		}
	}
}

func TestWhereBindsSearchAndFilterValues(t *testing.T) {
	spec := listingSpecs[domain.CollectionProcesses]

	where, args := spec.where(domain.CollectionQuery{
		Search:  "endless",
		Filters: []string{"idle", "running"},
	})

	// One bound argument per searched column, then one per filter value.
	if len(args) != len(spec.searchCols)+2 {
		t.Fatalf("expected %d args, got %d: %v", len(spec.searchCols)+2, len(args), args)
	}
	for _, arg := range args[:len(spec.searchCols)] {
		if arg != "%endless%" {
			t.Errorf("expected a wrapped LIKE pattern, got %v", arg)
		}
	}
	if !strings.Contains(where, "IN (?, ?)") {
		t.Errorf("expected two IN placeholders, got %q", where)
	}
	if strings.Contains(where, "endless") || strings.Contains(where, "idle") {
		t.Errorf("expected no literal client input in the SQL, got %q", where)
	}
}

// A search term is data, never pattern syntax: "100%" looks for that text.
func TestWhereEscapesLikeWildcards(t *testing.T) {
	spec := listingSpecs[domain.CollectionActions]

	_, args := spec.where(domain.CollectionQuery{Search: `100%_x\y`})
	if len(args) == 0 {
		t.Fatal("expected bound arguments")
	}
	if args[0] != `%100\%\_x\\y%` {
		t.Errorf("expected wildcards escaped, got %v", args[0])
	}
}

func TestOrderByResolvesThroughTheAllowlist(t *testing.T) {
	spec := listingSpecs[domain.CollectionProcesses]

	orderBy := spec.orderBy(domain.CollectionQuery{SortKey: "state", SortDir: domain.SortDescending})
	if !strings.HasPrefix(orderBy, "ORDER BY e.current_status DESC") {
		t.Errorf("expected the mapped column, got %q", orderBy)
	}
	if !strings.HasSuffix(orderBy, spec.tieBreak) {
		t.Errorf("expected the tie-break appended, got %q", orderBy)
	}
}

// An unmapped key produces no ORDER BY fragment, so it cannot be injected even
// if it somehow got past the handler's validation.
func TestOrderByIgnoresAnUnknownSortKey(t *testing.T) {
	spec := listingSpecs[domain.CollectionProcesses]

	orderBy := spec.orderBy(domain.CollectionQuery{
		SortKey: "p.name; DROP TABLE processes",
		SortDir: domain.SortAscending,
	})
	if orderBy != "ORDER BY "+spec.tieBreak {
		t.Errorf("expected only the tie-break, got %q", orderBy)
	}
}

// The pager reads its totals from selectCount, so it must narrow exactly the
// same rows selectPage returns.
func TestCountAndPageSharePredicateAndArguments(t *testing.T) {
	query := domain.CollectionQuery{Search: "user", Filters: []string{"springboot"}}
	spec := listingSpecs[domain.CollectionWorkers]

	countStatement, countArgs := spec.selectCount(query)
	pageStatement, pageArgs := spec.selectPage(workerColumns, query, domain.PageInfo{Page: 2, PageSize: 10})

	where, _ := spec.where(query)
	if where == "" {
		t.Fatal("expected this query to produce a predicate")
	}
	if !strings.Contains(countStatement, where) {
		t.Errorf("count statement is missing the predicate:\n%s", countStatement)
	}
	if !strings.Contains(pageStatement, where) {
		t.Errorf("page statement is missing the predicate:\n%s", pageStatement)
	}

	// selectPage appends LIMIT and OFFSET after the shared predicate arguments.
	if len(pageArgs) != len(countArgs)+2 {
		t.Fatalf("expected %d page args, got %d", len(countArgs)+2, len(pageArgs))
	}
	for i, arg := range countArgs {
		if pageArgs[i] != arg {
			t.Errorf("arg %d differs: count %v, page %v", i, arg, pageArgs[i])
		}
	}
	if pageArgs[len(pageArgs)-2] != 10 || pageArgs[len(pageArgs)-1] != 10 {
		t.Errorf("expected LIMIT 10 OFFSET 10, got %v", pageArgs[len(pageArgs)-2:])
	}
}

// Every sort key the API advertises must map to SQL, or asking for it would
// silently fall back to the tie-break instead of sorting.
func TestEverySchemaSortKeyIsMapped(t *testing.T) {
	for collection, schema := range domain.CollectionSchemas {
		spec, ok := listingSpecs[collection]
		if !ok {
			t.Errorf("%s: no listing spec", collection)
			continue
		}
		for _, key := range schema.SortKeys {
			if _, mapped := spec.sortCols[key]; !mapped {
				t.Errorf("%s: sort key %q has no SQL mapping", collection, key)
			}
		}
		if schema.FilterParam != "" && spec.filterCol == "" {
			t.Errorf("%s: schema advertises a %s facet but the spec has no filter column",
				collection, schema.FilterParam)
		}
	}
}
