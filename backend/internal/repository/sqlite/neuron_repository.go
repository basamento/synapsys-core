package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"synapsys-core/internal/domain"
)

type NeuronRepository struct {
	db *sql.DB
}

func NewNeuronRepository(db *sql.DB) *NeuronRepository {
	return &NeuronRepository{db: db}
}

func (r *NeuronRepository) ListAll(ctx context.Context) ([]domain.Neuron, error) {
	const query = `
		SELECT
		    ID,
			name,
			application_name,
			current_state,
			desired_state,
			last_touch,
			type,
			ping_timing
		FROM neurons
		ORDER BY last_touch DESC
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []domain.Neuron
	for rows.Next() {
		var n domain.Neuron
		if err := rows.Scan(
			&n.ID,
			&n.Name,
			&n.ApplicationName,
			&n.CurrentState,
			&n.DesiredState,
			&n.LastTouch,
			&n.Type,
			&n.PingTiming,
		); err != nil {
			return nil, err
		}
		results = append(results, n)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate neuron rows: %w", err)
	}
	return results, nil
}

func (r *NeuronRepository) GetByNames(
	ctx context.Context,
	appName string,
	names []string,
) ([]domain.Neuron, error) {

	if len(names) == 0 {
		return nil, nil
	}

	placeholders := make([]string, len(names))
	args := make([]any, 0, len(names)+1)

	args = append(args, appName)

	for i, name := range names {
		placeholders[i] = "?"
		args = append(args, name)
	}

	query := fmt.Sprintf(`
		SELECT
			name,
			application_name,
			current_state,
			desired_state,
			last_touch,
			type,
			ping_timing
		FROM neurons
		WHERE application_name = ?
		  AND name IN (%s);
	`, strings.Join(placeholders, ","))

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []domain.Neuron

	for rows.Next() {
		var n domain.Neuron
		if err := rows.Scan(
			&n.Name,
			&n.ApplicationName,
			&n.CurrentState,
			&n.DesiredState,
			&n.LastTouch,
			&n.Type,
			&n.PingTiming,
		); err != nil {
			return nil, err
		}
		result = append(result, n)
	}

	return result, rows.Err()
}

func (r *NeuronRepository) Upsert(ctx context.Context, n domain.Neuron) error {
	// creating the query
	const query = `
		INSERT INTO neurons (
			name,
			application_name,
			current_state,
			desired_state,
			last_touch,
			ping_timing
		)
		VALUES (?, ?, ?, ?, ?, ?)
		ON CONFLICT(name) DO UPDATE SET
			application_name = excluded.application_name,
			current_state = excluded.current_state,
			last_touch = excluded.last_touch,
			ping_timing = excluded.ping_timing;
		`
	// execute the query
	_, err := r.db.ExecContext(
		ctx,
		query,
		n.Name,
		n.ApplicationName,
		string(n.CurrentState),
		string(n.DesiredState),
		n.LastTouch,
		n.PingTiming,
	)
	// if query exec generate error return it
	return err
}

func (r *NeuronRepository) BatchUpsert(
	ctx context.Context,
	neurons []domain.Neuron,
) error {
	if len(neurons) == 0 {
		return nil
	}
	var (
		values []string
		args   []any
	)

	for i, n := range neurons {
		// (?, ?, ?, ?, ?, ?, ?)
		values = append(values,
			fmt.Sprintf("(?, ?, ?, ?, ?, ?, ?)"),
		)
		args = append(args,
			n.Name,
			n.ApplicationName,
			string(n.CurrentState),
			string(n.DesiredState),
			n.LastTouch,
			n.Type,
			n.PingTiming,
		)
		_ = i // clarity, not strictly needed
	}

	query := fmt.Sprintf(`
		INSERT INTO neurons (
			name,
			application_name,
			current_state,
			desired_state,
			last_touch,
			type,
			ping_timing
		)
		VALUES %s
		ON CONFLICT(name) DO UPDATE SET
			application_name = excluded.application_name,
			current_state = excluded.current_state,
			last_touch = excluded.last_touch,
			type = excluded.type,
			ping_timing = excluded.ping_timing;
	`, strings.Join(values, ","))
	_, err := r.db.ExecContext(ctx, query, args...)
	return err
}

func (r *NeuronRepository) UpdateDesiredState(
	ctx context.Context,
	neuronName string,
	state domain.NeuronState,
) (bool, error) {
	const query = `
		UPDATE neurons
		SET desired_state = ?
		WHERE name = ?
	`
	res, err := r.db.ExecContext(ctx, query, state, neuronName)
	if err != nil {
		return false, fmt.Errorf("update desired_state for neuron %q: %w", neuronName, err)
	}

	affected, err := res.RowsAffected()
	if err != nil {
		return false, fmt.Errorf("rows affected for neuron %q: %w", neuronName, err)
	}

	return affected > 0, nil
}

func (r *NeuronRepository) WithTx(
	ctx context.Context,
	fn func(*sql.Tx) error,
) error {

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	if err := fn(tx); err != nil {
		_ = tx.Rollback()
		return err
	}

	return tx.Commit()
}
