package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"synapsys-core/internal/domain"
)

type ProcessRepository struct {
	db *sql.DB
}

func NewProcessRepository(db *sql.DB) *ProcessRepository {
	return &ProcessRepository{db: db}
}

func (r *ProcessRepository) ListAll(ctx context.Context) ([]domain.ProcessView, error) {
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
			e.run_id,
			e.created_at,
			e.modified_at,
			e.current_status,
			e.desired_state,
			e.status
		FROM processes p
		INNER JOIN workers w ON w.id = p.worker_id
		INNER JOIN executions e ON e.id = (
			SELECT e2.id
			FROM executions e2
			WHERE e2.process_id = p.id
			ORDER BY e2.id DESC
			LIMIT 1
		)
		ORDER BY w.last_touch DESC, p.name ASC
	`

	rows, err := r.db.QueryContext(ctx, query)
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
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate process rows: %w", err)
	}
	return results, nil
}

func (r *ProcessRepository) SyncHeartbeat(
	ctx context.Context,
	worker domain.Worker,
	observations []domain.ProcessObservation,
	logBatches ...[]domain.ProcessLog,
) ([]domain.ProcessCommand, error) {
	if err := worker.Validate(); err != nil {
		return nil, err
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	workerID, err := upsertWorker(ctx, tx, worker)
	if err != nil {
		return nil, err
	}
	if len(observations) == 0 {
		if len(logBatches) > 0 {
			if err := insertExecutionLogs(ctx, tx, workerID, logBatches[0]); err != nil {
				return nil, err
			}
		}
		if err := tx.Commit(); err != nil {
			return nil, err
		}
		return nil, nil
	}

	names := make([]string, 0, len(observations))
	for _, observation := range observations {
		if err := validateObservation(observation); err != nil {
			return nil, err
		}
		names = append(names, observation.Name)
		if err := upsertProcessObservation(ctx, tx, workerID, worker.LastTouch, observation); err != nil {
			return nil, err
		}
	}

	if err := cleanupAckedCommands(ctx, tx, workerID, names, worker.LastTouch); err != nil {
		return nil, err
	}
	if err := completeFinishedExecutions(ctx, tx, workerID, names, worker.LastTouch); err != nil {
		return nil, err
	}
	if len(logBatches) > 0 {
		if err := insertExecutionLogs(ctx, tx, workerID, logBatches[0]); err != nil {
			return nil, err
		}
	}

	commands, err := listCommands(ctx, tx, workerID, names)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return commands, nil
}

func (r *ProcessRepository) ListExecutionLogs(
	ctx context.Context,
	executionID int64,
	afterSequence int64,
	limit int,
) ([]domain.ExecutionLog, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, execution_id, sequence, timestamp, source, level, message
		FROM execution_logs
		WHERE execution_id = ? AND sequence > ?
		ORDER BY sequence ASC
		LIMIT ?
	`, executionID, afterSequence, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	logs := make([]domain.ExecutionLog, 0)
	for rows.Next() {
		var entry domain.ExecutionLog
		if err := rows.Scan(
			&entry.ID,
			&entry.ExecutionID,
			&entry.Sequence,
			&entry.Timestamp,
			&entry.Source,
			&entry.Level,
			&entry.Message,
		); err != nil {
			return nil, err
		}
		logs = append(logs, entry)
	}
	return logs, rows.Err()
}

func insertExecutionLogs(ctx context.Context, tx *sql.Tx, workerID int64, logs []domain.ProcessLog) error {
	for _, entry := range logs {
		result, err := tx.ExecContext(ctx, `
			INSERT INTO execution_logs (execution_id, sequence, timestamp, source, level, message)
			SELECT e.id, ?, ?, ?, ?, ?
			FROM processes p
			INNER JOIN executions e ON e.process_id = p.id AND e.run_id = ?
			WHERE p.worker_id = ? AND p.name = ?
			ON CONFLICT(execution_id, sequence) DO NOTHING
		`, entry.Sequence, entry.Timestamp, entry.Source, entry.Level, entry.Message,
			entry.RunID, workerID, entry.ProcessName)
		if err != nil {
			return fmt.Errorf("insert log for process %q: %w", entry.ProcessName, err)
		}
		if affected, err := result.RowsAffected(); err == nil && affected == 0 {
			// A duplicate is expected on heartbeat retry. An unknown process/run is
			// also ignored so stale logs cannot make a healthy heartbeat fail.
			continue
		}
	}
	return nil
}

func (r *ProcessRepository) UpdateDesiredCommand(
	ctx context.Context,
	processID int64,
	state domain.ExecutionState,
	runID *int64,
) (bool, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return false, err
	}
	defer tx.Rollback()

	const processQuery = `
		UPDATE processes
		SET
			desired_token = desired_token + 1,
			run_id = CASE
				WHEN ? = 'running' THEN ?
				ELSE run_id
			END
		WHERE id = ?
		RETURNING id
	`

	var runVal any = nil
	if runID != nil {
		runVal = *runID
	}

	var updatedID int64
	err = tx.QueryRowContext(ctx, processQuery, string(state), runVal, processID).Scan(&updatedID)
	if err == sql.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("update command token for process %d: %w", processID, err)
	}

	var executionID int64
	if state == domain.ExecutionStateRunning {
		// A start always opens a new immutable run record. Any previously active
		// execution is closed defensively before the partial unique index is hit.
		if _, err := tx.ExecContext(ctx, `
			UPDATE executions
			SET status = 'inactive', modified_at = CURRENT_TIMESTAMP
			WHERE process_id = ? AND status = 'active'
		`, processID); err != nil {
			return false, fmt.Errorf("close previous execution for process %d: %w", processID, err)
		}

		var currentState domain.ExecutionState
		if err := tx.QueryRowContext(ctx, `
			SELECT current_status
			FROM executions
			WHERE process_id = ?
			ORDER BY id DESC
			LIMIT 1
		`, processID).Scan(&currentState); err != nil {
			return false, fmt.Errorf("read current state for process %d: %w", processID, err)
		}

		if err := tx.QueryRowContext(ctx, `
			INSERT INTO executions (
				process_id, run_id, created_at, modified_at,
				current_status, desired_state, status
			)
			VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, 'running', 'active')
			RETURNING id
		`, processID, runVal, string(currentState)).Scan(&executionID); err != nil {
			return false, fmt.Errorf("create execution for process %d: %w", processID, err)
		}
	} else {
		if err := tx.QueryRowContext(ctx, `
			UPDATE executions
			SET desired_state = ?, modified_at = CURRENT_TIMESTAMP
			WHERE id = (
				SELECT id FROM executions
				WHERE process_id = ?
				ORDER BY id DESC
				LIMIT 1
			)
			RETURNING id
		`, string(state), processID).Scan(&executionID); err != nil {
			return false, fmt.Errorf("update desired state for process %d: %w", processID, err)
		}
	}

	actionType := domain.ActionTypeStop
	if state == domain.ExecutionStateRunning {
		actionType = domain.ActionTypeStart
	}
	if err := insertAction(ctx, tx, executionID, domain.ActionStatusWaiting, actionType); err != nil {
		return false, err
	}

	if err := tx.Commit(); err != nil {
		return false, err
	}
	return true, nil
}

func scanProcessView(rows *sql.Rows) (domain.ProcessView, error) {
	var view domain.ProcessView
	var processRunID sql.NullInt64
	var executionRunID sql.NullInt64
	if err := rows.Scan(
		&view.Process.ID,
		&view.Process.Name,
		&view.Process.WorkerID,
		&view.Process.Type,
		&view.Process.CreatedAt,
		&view.Process.PingTiming,
		&view.Process.DesiredToken,
		&view.Process.AckToken,
		&processRunID,
		&view.Worker.ID,
		&view.Worker.Name,
		&view.Worker.FirstConnection,
		&view.Worker.LastConnection,
		&view.Worker.Framework,
		&view.Worker.Host,
		&view.Worker.LastTouch,
		&view.Execution.ID,
		&view.Execution.ProcessID,
		&executionRunID,
		&view.Execution.CreatedAt,
		&view.Execution.ModifiedAt,
		&view.Execution.CurrentStatus,
		&view.Execution.DesiredState,
		&view.Execution.Status,
	); err != nil {
		return domain.ProcessView{}, err
	}
	if processRunID.Valid {
		v := processRunID.Int64
		view.Process.RunID = &v
	}
	if executionRunID.Valid {
		v := executionRunID.Int64
		view.Execution.RunID = &v
	}
	return view, nil
}

func upsertWorker(ctx context.Context, tx *sql.Tx, worker domain.Worker) (int64, error) {
	const query = `
		INSERT INTO workers (
			name,
			first_connection,
			last_connection,
			framework,
			host,
			last_touch
		)
		VALUES (?, ?, ?, ?, ?, ?)
		ON CONFLICT(name) DO UPDATE SET
			last_connection = excluded.last_connection,
			framework = excluded.framework,
			host = excluded.host,
			last_touch = excluded.last_touch
		RETURNING id
	`

	var id int64
	err := tx.QueryRowContext(
		ctx,
		query,
		worker.Name,
		worker.FirstConnection,
		worker.LastConnection,
		string(worker.Framework),
		worker.Host,
		worker.LastTouch,
	).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("upsert worker %q: %w", worker.Name, err)
	}
	return id, nil
}

func upsertProcessObservation(
	ctx context.Context,
	tx *sql.Tx,
	workerID int64,
	now any,
	observation domain.ProcessObservation,
) error {
	var previousAck int64
	var existingExecutionID sql.NullInt64
	// Scoped by worker: process names are only unique within a worker.
	_ = tx.QueryRowContext(ctx, `
		SELECT p.ack_token, e.id
		FROM processes p
		LEFT JOIN executions e ON e.id = (
			SELECT e2.id FROM executions e2
			WHERE e2.process_id = p.id
			ORDER BY e2.id DESC
			LIMIT 1
		)
		WHERE p.worker_id = ? AND p.name = ?
	`, workerID, observation.Name).Scan(&previousAck, &existingExecutionID)

	const processQuery = `
		INSERT INTO processes (
			worker_id,
			name,
			type,
			created_at,
			ping_timing,
			desired_token,
			ack_token,
			run_id
		)
		VALUES (?, ?, ?, ?, ?, 0, ?, NULL)
		ON CONFLICT(worker_id, name) DO UPDATE SET
			type = excluded.type,
			ping_timing = excluded.ping_timing,
			ack_token = excluded.ack_token
		RETURNING id
	`

	var processID int64
	if err := tx.QueryRowContext(
		ctx,
		processQuery,
		workerID,
		observation.Name,
		string(observation.Type),
		now,
		observation.PingTiming,
		observation.AckToken,
	).Scan(&processID); err != nil {
		return fmt.Errorf("upsert process %q: %w", observation.Name, err)
	}

	var executionID int64
	if !existingExecutionID.Valid {
		status := domain.ExecutionStatusInactive
		if observation.CurrentStatus == domain.ExecutionStateRunning ||
			observation.CurrentStatus == domain.ExecutionStateStopping {
			status = domain.ExecutionStatusActive
		}
		if err := tx.QueryRowContext(ctx, `
			INSERT INTO executions (
				process_id, run_id, created_at, modified_at,
				current_status, desired_state, status
			)
			VALUES (?, NULL, ?, ?, ?, 'idle', ?)
			RETURNING id
		`, processID, now, now, string(observation.CurrentStatus), string(status)).Scan(&executionID); err != nil {
			return fmt.Errorf("create initial execution for process %q: %w", observation.Name, err)
		}
	} else {
		executionID = existingExecutionID.Int64
		if err := tx.QueryRowContext(ctx, `
			UPDATE executions
			SET
				current_status = ?,
				modified_at = ?,
				status = CASE
					WHEN ? IN ('running', 'stopping') THEN 'active'
					WHEN ? IN ('idle', 'failed') AND desired_state = 'idle' THEN 'inactive'
					ELSE status
				END
			WHERE id = ?
			RETURNING id
		`, string(observation.CurrentStatus), now, string(observation.CurrentStatus), string(observation.CurrentStatus), executionID).Scan(&executionID); err != nil {
			return fmt.Errorf("update execution for process %q: %w", observation.Name, err)
		}
	}

	if !existingExecutionID.Valid {
		return insertAction(ctx, tx, executionID, domain.ActionStatusDone, domain.ActionTypeCreate)
	}
	if observation.AckToken > previousAck {
		return insertAction(ctx, tx, executionID, domain.ActionStatusDone, domain.ActionTypeAck)
	}
	return nil
}

func cleanupAckedCommands(ctx context.Context, tx *sql.Tx, workerID int64, names []string, now any) error {
	if len(names) == 0 {
		return nil
	}

	placeholders, args := namesFilterArgs(workerID, names)
	query := fmt.Sprintf(`
		SELECT e.id
		FROM processes p
		INNER JOIN executions e ON e.id = (
			SELECT e2.id FROM executions e2
			WHERE e2.process_id = p.id
			ORDER BY e2.id DESC
			LIMIT 1
		)
		WHERE p.worker_id = ?
		  AND p.name IN (%s)
		  AND (
			(e.desired_state = 'running' AND p.ack_token >= p.desired_token)
			OR
			(e.desired_state = 'stopping' AND p.ack_token >= p.desired_token AND e.current_status IN ('idle', 'failed'))
		  )
	`, placeholders)

	rows, err := tx.QueryContext(ctx, query, args...)
	if err != nil {
		return err
	}
	var executionIDs []int64
	for rows.Next() {
		var executionID int64
		if err := rows.Scan(&executionID); err != nil {
			rows.Close()
			return err
		}
		executionIDs = append(executionIDs, executionID)
	}
	if err := rows.Close(); err != nil {
		return err
	}
	if err := rows.Err(); err != nil {
		return err
	}
	if len(executionIDs) == 0 {
		return nil
	}

	// The worker's acknowledgement is already logged by upsertProcessObservation when
	// its ack token advances. Completion resolves the pending start/stop action
	// instead of logging a second, identical ack.
	completedPlaceholders, completedArgs := int64FilterArgs(executionIDs)
	if _, err := tx.ExecContext(ctx, fmt.Sprintf(`
		UPDATE actions
		SET status = ?
		WHERE execution_id IN (%s)
		  AND status = ?
	`, completedPlaceholders), append([]any{string(domain.ActionStatusDone)}, append(completedArgs, string(domain.ActionStatusWaiting))...)...); err != nil {
		return fmt.Errorf("resolve pending actions: %w", err)
	}

	executionPlaceholders, executionArgs := int64FilterArgs(executionIDs)
	executionArgs = append([]any{now}, executionArgs...)
	if _, err := tx.ExecContext(ctx, fmt.Sprintf(`
		UPDATE executions
		SET desired_state = 'idle', modified_at = ?
		WHERE id IN (%s)
	`, executionPlaceholders), executionArgs...); err != nil {
		return err
	}

	return nil
}

func completeFinishedExecutions(ctx context.Context, tx *sql.Tx, workerID int64, names []string, now any) error {
	if len(names) == 0 {
		return nil
	}

	placeholders, args := namesFilterArgs(workerID, names)
	rows, err := tx.QueryContext(ctx, fmt.Sprintf(`
		SELECT e.id, p.id
		FROM processes p
		INNER JOIN executions e ON e.id = (
			SELECT e2.id FROM executions e2
			WHERE e2.process_id = p.id
			ORDER BY e2.id DESC
			LIMIT 1
		)
		WHERE p.worker_id = ?
		  AND p.name IN (%s)
		  AND e.status = 'active'
		  AND e.desired_state = 'idle'
		  AND e.current_status IN ('idle', 'failed')
	`, placeholders), args...)
	if err != nil {
		return err
	}
	var executionIDs []int64
	var processIDs []int64
	for rows.Next() {
		var executionID, processID int64
		if err := rows.Scan(&executionID, &processID); err != nil {
			rows.Close()
			return err
		}
		executionIDs = append(executionIDs, executionID)
		processIDs = append(processIDs, processID)
	}
	if err := rows.Close(); err != nil {
		return err
	}
	if err := rows.Err(); err != nil {
		return err
	}
	if len(executionIDs) == 0 {
		return nil
	}

	executionPlaceholders, executionArgs := int64FilterArgs(executionIDs)
	executionArgs = append([]any{now}, executionArgs...)
	if _, err := tx.ExecContext(ctx, fmt.Sprintf(`
		UPDATE executions
		SET status = 'inactive', modified_at = ?
		WHERE id IN (%s)
	`, executionPlaceholders), executionArgs...); err != nil {
		return err
	}

	processPlaceholders, processArgs := int64FilterArgs(processIDs)
	if _, err := tx.ExecContext(ctx, fmt.Sprintf(`
		UPDATE processes
		SET run_id = NULL
		WHERE id IN (%s)
	`, processPlaceholders), processArgs...); err != nil {
		return err
	}

	return nil
}

func listCommands(ctx context.Context, tx *sql.Tx, workerID int64, names []string) ([]domain.ProcessCommand, error) {
	if len(names) == 0 {
		return nil, nil
	}

	placeholders, args := namesFilterArgs(workerID, names)
	query := fmt.Sprintf(`
		SELECT
			p.name,
			p.type,
			e.desired_state,
			p.desired_token,
			p.run_id
		FROM processes p
		INNER JOIN executions e ON e.id = (
			SELECT e2.id FROM executions e2
			WHERE e2.process_id = p.id
			ORDER BY e2.id DESC
			LIMIT 1
		)
		WHERE p.worker_id = ?
		  AND p.name IN (%s)
		ORDER BY p.name ASC
	`, placeholders)

	rows, err := tx.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var commands []domain.ProcessCommand
	for rows.Next() {
		var command domain.ProcessCommand
		var runID sql.NullInt64
		if err := rows.Scan(
			&command.Name,
			&command.Type,
			&command.DesiredState,
			&command.DesiredToken,
			&runID,
		); err != nil {
			return nil, err
		}
		if runID.Valid {
			v := runID.Int64
			command.RunID = &v
		}
		commands = append(commands, command)
	}
	return commands, rows.Err()
}

func insertAction(ctx context.Context, tx *sql.Tx, executionID int64, status domain.ActionStatus, actionType domain.ActionType) error {
	const query = `
		INSERT INTO actions (execution_id, created_at, status, type)
		VALUES (?, CURRENT_TIMESTAMP, ?, ?)
	`
	if _, err := tx.ExecContext(ctx, query, executionID, string(status), string(actionType)); err != nil {
		return fmt.Errorf("insert action for execution %d: %w", executionID, err)
	}
	return nil
}

func validateObservation(observation domain.ProcessObservation) error {
	process := domain.Process{
		Name:         observation.Name,
		Type:         observation.Type,
		PingTiming:   observation.PingTiming,
		DesiredToken: 0,
		AckToken:     observation.AckToken,
	}
	if err := process.Validate(); err != nil {
		return err
	}
	execution := domain.Execution{
		CurrentStatus: observation.CurrentStatus,
		DesiredState:  domain.ExecutionStateIdle,
		Status:        domain.ExecutionStatusActive,
	}
	return execution.Validate()
}

func namesFilterArgs(workerID int64, names []string) (string, []any) {
	placeholders := make([]string, len(names))
	args := make([]any, 0, len(names)+1)
	args = append(args, workerID)
	for i, name := range names {
		placeholders[i] = "?"
		args = append(args, name)
	}
	return strings.Join(placeholders, ","), args
}

func int64FilterArgs(ids []int64) (string, []any) {
	placeholders := make([]string, len(ids))
	args := make([]any, 0, len(ids))
	for i, id := range ids {
		placeholders[i] = "?"
		args = append(args, id)
	}
	return strings.Join(placeholders, ","), args
}
