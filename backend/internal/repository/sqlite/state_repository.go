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
	workerPage, err := r.pageInfo(ctx, "workers", pagination.Workers)
	if err != nil {
		return domain.StateSnapshot{}, fmt.Errorf("count workers: %w", err)
	}
	processPage, err := r.pageInfo(ctx, "processes", pagination.Processes)
	if err != nil {
		return domain.StateSnapshot{}, fmt.Errorf("count processes: %w", err)
	}
	executionPage, err := r.pageInfo(ctx, "executions", pagination.Executions)
	if err != nil {
		return domain.StateSnapshot{}, fmt.Errorf("count executions: %w", err)
	}
	actionPage, err := r.pageInfo(ctx, "actions", pagination.Actions)
	if err != nil {
		return domain.StateSnapshot{}, fmt.Errorf("count actions: %w", err)
	}

	workers, err := r.listWorkers(ctx, workerPage)
	if err != nil {
		return domain.StateSnapshot{}, fmt.Errorf("list workers: %w", err)
	}

	processes, err := r.listProcesses(ctx, processPage)
	if err != nil {
		return domain.StateSnapshot{}, fmt.Errorf("list processes: %w", err)
	}
	processViews, err := r.listProcessViews(ctx, processPage)
	if err != nil {
		return domain.StateSnapshot{}, fmt.Errorf("list process views: %w", err)
	}

	executions, err := r.listExecutions(ctx, executionPage)
	if err != nil {
		return domain.StateSnapshot{}, fmt.Errorf("list executions: %w", err)
	}

	actions, err := r.listActions(ctx, actionPage)
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
			Workers:    workerPage,
			Processes:  processPage,
			Executions: executionPage,
			Actions:    actionPage,
		},
	}, nil
}

func (r *NeuronRepository) pageInfo(
	ctx context.Context,
	table string,
	pagination domain.CollectionPagination,
) (domain.PageInfo, error) {
	var totalItems int
	if err := r.db.QueryRowContext(ctx, fmt.Sprintf("SELECT COUNT(*) FROM %s", table)).Scan(&totalItems); err != nil {
		return domain.PageInfo{}, err
	}

	pageSize := pagination.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}
	page := pagination.Page
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

func (r *NeuronRepository) listWorkers(ctx context.Context, page domain.PageInfo) ([]domain.Worker, error) {
	const query = `
		SELECT id, name, first_connection, last_connection, framework, host, last_touch
		FROM workers
		ORDER BY last_touch DESC, name ASC
		LIMIT ? OFFSET ?
	`

	rows, err := r.db.QueryContext(ctx, query, page.PageSize, pageOffset(page))
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
		); err != nil {
			return nil, err
		}
		workers = append(workers, worker)
	}
	return workers, rows.Err()
}

func (r *NeuronRepository) listProcesses(ctx context.Context, page domain.PageInfo) ([]domain.Process, error) {
	const query = `
		SELECT id, name, worker_id, type, created_at, ping_timing, desired_token, ack_token, run_id
		FROM processes
		ORDER BY created_at DESC, name ASC
		LIMIT ? OFFSET ?
	`

	rows, err := r.db.QueryContext(ctx, query, page.PageSize, pageOffset(page))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var processes []domain.Process
	for rows.Next() {
		var process domain.Process
		var runID sql.NullInt64
		if err := rows.Scan(
			&process.ID,
			&process.Name,
			&process.WorkerID,
			&process.Type,
			&process.CreatedAt,
			&process.PingTiming,
			&process.DesiredToken,
			&process.AckToken,
			&runID,
		); err != nil {
			return nil, err
		}
		if runID.Valid {
			v := runID.Int64
			process.RunID = &v
		}
		processes = append(processes, process)
	}
	return processes, rows.Err()
}

func (r *NeuronRepository) listProcessViews(ctx context.Context, page domain.PageInfo) ([]domain.ProcessView, error) {
	const query = `
		SELECT
			p.id,
			p.name,
			p.worker_id,
			p.type,
			p.created_at,
			p.ping_timing,
			p.desired_token,
			p.ack_token,
			p.run_id,
			w.id,
			w.name,
			w.first_connection,
			w.last_connection,
			w.framework,
			w.host,
			w.last_touch,
			e.id,
			e.process_id,
			e.created_at,
			e.modified_at,
			e.current_status,
			e.desired_state,
			e.status
		FROM processes p
		INNER JOIN workers w ON w.id = p.worker_id
		INNER JOIN executions e ON e.process_id = p.id
		ORDER BY p.created_at DESC, p.name ASC
		LIMIT ? OFFSET ?
	`

	rows, err := r.db.QueryContext(ctx, query, page.PageSize, pageOffset(page))
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

func (r *NeuronRepository) listExecutions(ctx context.Context, page domain.PageInfo) ([]domain.Execution, error) {
	const query = `
		SELECT id, process_id, created_at, modified_at, current_status, desired_state, status
		FROM executions
		ORDER BY modified_at DESC, id DESC
		LIMIT ? OFFSET ?
	`

	rows, err := r.db.QueryContext(ctx, query, page.PageSize, pageOffset(page))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var executions []domain.Execution
	for rows.Next() {
		var execution domain.Execution
		if err := rows.Scan(
			&execution.ID,
			&execution.ProcessID,
			&execution.CreatedAt,
			&execution.ModifiedAt,
			&execution.CurrentStatus,
			&execution.DesiredState,
			&execution.Status,
		); err != nil {
			return nil, err
		}
		executions = append(executions, execution)
	}
	return executions, rows.Err()
}

func (r *NeuronRepository) listActions(ctx context.Context, page domain.PageInfo) ([]domain.Action, error) {
	const query = `
		SELECT id, execution_id, created_at, status, type
		FROM actions
		ORDER BY created_at DESC, id DESC
		LIMIT ? OFFSET ?
	`

	rows, err := r.db.QueryContext(ctx, query, page.PageSize, pageOffset(page))
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
