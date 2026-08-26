package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"synapsys-core/internal/domain"
)

func (r *NeuronRepository) ListState(
	ctx context.Context,
	pagination domain.StatePagination,
) (domain.StateSnapshot, error) {
	queries := map[domain.Collection]domain.CollectionQuery{
		domain.CollectionWorkers:    pagination.Workers,
		domain.CollectionProcesses:  pagination.Processes,
		domain.CollectionExecutions: pagination.Executions,
		domain.CollectionActions:    pagination.Actions,
	}

	pages := make(map[domain.Collection]domain.PageInfo, len(queries))
	for _, collection := range domain.Collections {
		page, err := r.pageInfo(ctx, collection, queries[collection])
		if err != nil {
			return domain.StateSnapshot{}, fmt.Errorf("count %s: %w", collection, err)
		}
		pages[collection] = page
	}

	workers, err := r.listWorkers(ctx, queries[domain.CollectionWorkers], pages[domain.CollectionWorkers])
	if err != nil {
		return domain.StateSnapshot{}, fmt.Errorf("list workers: %w", err)
	}

	// The flat process list and the joined view are the same rows read two
	// ways, so one query feeds both and their counts cannot disagree.
	processViews, err := r.listProcessViews(ctx, queries[domain.CollectionProcesses], pages[domain.CollectionProcesses])
	if err != nil {
		return domain.StateSnapshot{}, fmt.Errorf("list processes: %w", err)
	}
	processes := make([]domain.Process, 0, len(processViews))
	for _, view := range processViews {
		processes = append(processes, view.Process)
	}

	executions, err := r.listExecutions(ctx, queries[domain.CollectionExecutions], pages[domain.CollectionExecutions])
	if err != nil {
		return domain.StateSnapshot{}, fmt.Errorf("list executions: %w", err)
	}

	actions, err := r.listActions(ctx, queries[domain.CollectionActions], pages[domain.CollectionActions])
	if err != nil {
		return domain.StateSnapshot{}, fmt.Errorf("list actions: %w", err)
	}

	return domain.StateSnapshot{
		Workers:      workers,
		Processes:    processes,
		Executions:   executions,
		Actions:      actions,
		ProcessViews: processViews,
		Pagination: domain.StatePageInfo{
			Workers:    pages[domain.CollectionWorkers],
			Processes:  pages[domain.CollectionProcesses],
			Executions: pages[domain.CollectionExecutions],
			Actions:    pages[domain.CollectionActions],
		},
	}, nil
}

// pageInfo resolves how many rows the query matches and which page of them is
// actually reachable. A page beyond the end clamps to the last one, so a filter
// that shrinks a listing never leaves the operator staring at an empty table.
func (r *NeuronRepository) pageInfo(
	ctx context.Context,
	collection domain.Collection,
	query domain.CollectionQuery,
) (domain.PageInfo, error) {
	statement, args := listingSpecs[collection].selectCount(query)

	var totalItems int
	if err := r.db.QueryRowContext(ctx, statement, args...).Scan(&totalItems); err != nil {
		return domain.PageInfo{}, err
	}

	pageSize := query.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}
	page := query.Page
	if page <= 0 {
		page = 1
	}

	totalPages := 1
	if totalItems > 0 {
		totalPages = (totalItems + pageSize - 1) / pageSize
	}
	if page > totalPages {
		page = totalPages
	}

	return domain.PageInfo{
		Page:       page,
		PageSize:   pageSize,
		TotalItems: totalItems,
		TotalPages: totalPages,
	}, nil
}

const workerColumns = `w.id, w.name, w.first_connection, w.last_connection, w.framework, w.host, w.last_touch, ` +
	workerProcessCount

func (r *NeuronRepository) listWorkers(
	ctx context.Context,
	query domain.CollectionQuery,
	page domain.PageInfo,
) ([]domain.Worker, error) {
	statement, args := listingSpecs[domain.CollectionWorkers].selectPage(workerColumns, query, page)

	rows, err := r.db.QueryContext(ctx, statement, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var workers []domain.Worker
	for rows.Next() {
		var worker domain.Worker
		if err := rows.Scan(
			&worker.ID,
			&worker.Name,
			&worker.FirstConnection,
			&worker.LastConnection,
			&worker.Framework,
			&worker.Host,
			&worker.LastTouch,
			&worker.ProcessCount,
		); err != nil {
			return nil, err
		}
		workers = append(workers, worker)
	}
	return workers, rows.Err()
}

const processViewColumns = `
	p.id, p.name, p.worker_id, p.type, p.created_at, p.ping_timing, p.desired_token, p.ack_token, p.run_id,
	w.id, w.name, w.first_connection, w.last_connection, w.framework, w.host, w.last_touch,
	e.id, e.process_id, e.run_id, e.created_at, e.modified_at, e.current_status, e.desired_state, e.status`

func (r *NeuronRepository) listProcessViews(
	ctx context.Context,
	query domain.CollectionQuery,
	page domain.PageInfo,
) ([]domain.ProcessView, error) {
	statement, args := listingSpecs[domain.CollectionProcesses].selectPage(processViewColumns, query, page)

	rows, err := r.db.QueryContext(ctx, statement, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []domain.ProcessView
	for rows.Next() {
		view, err := scanProcessView(rows)
		if err != nil {
			return nil, err
		}
		results = append(results, view)
	}
	return results, rows.Err()
}

const executionColumns = `e.id, e.process_id, e.run_id, e.created_at, e.modified_at, e.current_status, e.desired_state, e.status`

func (r *NeuronRepository) listExecutions(
	ctx context.Context,
	query domain.CollectionQuery,
	page domain.PageInfo,
) ([]domain.Execution, error) {
	statement, args := listingSpecs[domain.CollectionExecutions].selectPage(executionColumns, query, page)

	rows, err := r.db.QueryContext(ctx, statement, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var executions []domain.Execution
	for rows.Next() {
		var execution domain.Execution
		var runID sql.NullInt64
		if err := rows.Scan(
			&execution.ID,
			&execution.ProcessID,
			&runID,
			&execution.CreatedAt,
			&execution.ModifiedAt,
			&execution.CurrentStatus,
			&execution.DesiredState,
			&execution.Status,
		); err != nil {
			return nil, err
		}
		if runID.Valid {
			v := runID.Int64
			execution.RunID = &v
		}
		executions = append(executions, execution)
	}
	return executions, rows.Err()
}

const actionColumns = `a.id, a.execution_id, a.created_at, a.status, a.type`

func (r *NeuronRepository) listActions(
	ctx context.Context,
	query domain.CollectionQuery,
	page domain.PageInfo,
) ([]domain.Action, error) {
	statement, args := listingSpecs[domain.CollectionActions].selectPage(actionColumns, query, page)

	rows, err := r.db.QueryContext(ctx, statement, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var actions []domain.Action
	for rows.Next() {
		var action domain.Action
		if err := rows.Scan(
			&action.ID,
			&action.ExecutionID,
			&action.CreatedAt,
			&action.Status,
			&action.Type,
		); err != nil {
			return nil, err
		}
		actions = append(actions, action)
	}
	return actions, rows.Err()
}

func pageOffset(page domain.PageInfo) int {
	return (page.Page - 1) * page.PageSize
}
