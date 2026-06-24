package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"synapsys-core/internal/domain"
)

func (r *NeuronRepository) ListState(ctx context.Context) (domain.StateSnapshot, error) {
	workers, err := r.listWorkers(ctx)
	if err != nil {
		return domain.StateSnapshot{}, fmt.Errorf("list workers: %w", err)
	}

	processes, err := r.listProcesses(ctx)
	if err != nil {
		return domain.StateSnapshot{}, fmt.Errorf("list processes: %w", err)
	}

	executions, err := r.listExecutions(ctx)
	if err != nil {
		return domain.StateSnapshot{}, fmt.Errorf("list executions: %w", err)
	}

	actions, err := r.listActions(ctx)
	if err != nil {
		return domain.StateSnapshot{}, fmt.Errorf("list actions: %w", err)
	}

	return domain.StateSnapshot{
		Workers:    workers,
		Processes:  processes,
		Executions: executions,
		Actions:    actions,
	}, nil
}

func (r *NeuronRepository) listWorkers(ctx context.Context) ([]domain.Worker, error) {
	const query = `
		SELECT id, name, first_connection, last_connection, framework, host, last_touch
		FROM workers
		ORDER BY last_touch DESC, name ASC
	`

	rows, err := r.db.QueryContext(ctx, query)
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

func (r *NeuronRepository) listProcesses(ctx context.Context) ([]domain.Process, error) {
	const query = `
		SELECT id, name, worker_id, type, created_at, ping_timing, desired_token, ack_token, run_id
		FROM processes
		ORDER BY created_at DESC, name ASC
	`

	rows, err := r.db.QueryContext(ctx, query)
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

func (r *NeuronRepository) listExecutions(ctx context.Context) ([]domain.Execution, error) {
	const query = `
		SELECT id, process_id, created_at, modified_at, current_status, desired_state, status
		FROM executions
		ORDER BY modified_at DESC, id DESC
	`

	rows, err := r.db.QueryContext(ctx, query)
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

func (r *NeuronRepository) listActions(ctx context.Context) ([]domain.Action, error) {
	const query = `
		SELECT id, execution_id, created_at, status, type
		FROM actions
		ORDER BY created_at DESC, id DESC
	`

	rows, err := r.db.QueryContext(ctx, query)
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
