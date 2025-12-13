package repository

import (
	"database/sql"
	"fmt"
	"log"
	"time"
)

const (
	DesiredRunning = "running"
	DesiredStopped = "idle"
)

type Neuron struct {
	ID             int64  `json:"id"`
	Name           string `json:"name"`
	CreatedAt      string `json:"created_at"`
	LastConnection string `json:"last_connection"`
	DesiredState   string `json:"desired_state"` // "running" | "idle"
	LastState      string `json:"last_state"`    // "running" | "idle"
	PingTiming     int    `json:"ping_timing"`
	Status         string `json:"status"` // "online" | "offline"
}

type NeuronState struct {
	ID    int64  `json:"id"`
	State string `json:"state"` // "online" | "offline"
}

type NeuronRepository struct {
	DB *sql.DB
}

func NewNeuronRepository(db *sql.DB) *NeuronRepository {
	return &NeuronRepository{DB: db}
}

func (r *NeuronRepository) CreateOrUpdate(name string, pingTiming int) (*Neuron, error) {

	_, err := r.DB.Exec(`
        INSERT INTO neurons (name, ping_timing, last_connection)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(name) DO UPDATE SET
            last_connection = CURRENT_TIMESTAMP,
            ping_timing = excluded.ping_timing
    `, name, pingTiming)
	if err != nil {
		return nil, err
	}

	row := r.DB.QueryRow(`
        SELECT id, name, created_at, last_connection, last_state, desired_state, ping_timing
        FROM neurons
        WHERE name = ?
    `, name)

	var n Neuron
	if err := row.Scan(
		&n.ID,
		&n.Name,
		&n.CreatedAt,
		&n.LastConnection,
		&n.LastState,
		&n.DesiredState,
		&n.PingTiming,
	); err != nil {
		return nil, err
	}

	return &n, nil
}

func (r *NeuronRepository) ListAll() ([]Neuron, error) {
	rows, err := r.DB.Query(`
        SELECT id, name, created_at, last_connection, desired_state, last_state, ping_timing
        FROM neurons
        ORDER BY id ASC
    `)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Neuron

	for rows.Next() {
		var n Neuron
		var pingTiming sql.NullInt64

		if err := rows.Scan(
			&n.ID,
			&n.Name,
			&n.CreatedAt,
			&n.LastConnection,
			&n.LastState,
			&n.DesiredState,
			&pingTiming,
		); err != nil {
			return nil, err
		}

		if pingTiming.Valid {
			n.PingTiming = int(pingTiming.Int64)
		} else {
			n.PingTiming = 0
		}

		now := time.Now().UTC()

		n.Status = "offline"

		if n.PingTiming > 0 {
			lastConn, err := time.Parse(time.RFC3339, n.LastConnection)
			if err != nil {
				log.Printf("[WARN] invalid last_connection for %s: %v", n.Name, err)
			} else {
				expiry := lastConn.Add(time.Duration(n.PingTiming) * time.Millisecond)

				if now.Before(expiry) {
					n.Status = "online"
				}
			}
		}

		list = append(list, n)
	}

	return list, nil
}

func (r *NeuronRepository) GetByID(id int64) (*Neuron, error) {
	row := r.DB.QueryRow(`
        SELECT id, name, created_at, last_connection, desired_state, last_state, ping_timing
        FROM neurons
        WHERE id = ?
    `, id)

	var n Neuron
	var pingTiming sql.NullInt64

	if err := row.Scan(
		&n.ID,
		&n.Name,
		&n.CreatedAt,
		&n.LastConnection,
		&n.DesiredState,
		&n.LastState,
		&pingTiming,
	); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // not found
		}
		return nil, err
	}

	if pingTiming.Valid {
		n.PingTiming = int(pingTiming.Int64)
	}

	// compute status (same logic as ListAll)
	n.Status = "offline"
	if n.PingTiming > 0 {
		lastConn, err := time.Parse(time.RFC3339, n.LastConnection)
		if err == nil {
			expiry := lastConn.Add(time.Duration(n.PingTiming) * time.Millisecond)
			if time.Now().UTC().Before(expiry) {
				n.Status = "online"
			}
		}
	}

	return &n, nil
}

func (r *NeuronRepository) SetDesiredStateByID(id int64, state string) error {
	if state != DesiredRunning && state != DesiredStopped {
		return fmt.Errorf("invalid desired state: %s", state)
	}

	_, err := r.DB.Exec(`
        UPDATE neurons
        SET desired_state = ?
        WHERE id = ?
    `, state, id)

	return err
}

func (r *NeuronRepository) Heartbeat(name string, lastState string) (string, error) {

	if !isValidState(lastState) {
		return "", fmt.Errorf("invalid last_state: %s", lastState)
	}

	row := r.DB.QueryRow(`
        UPDATE neurons
        SET
            last_connection = CURRENT_TIMESTAMP,
            last_state = ?,
            desired_state = CASE
                WHEN desired_state = 'running' AND ? = 'running'
                THEN 'idle'
                ELSE desired_state
            END
        WHERE name = ?
        RETURNING desired_state
    `, lastState, lastState, name)

	var desiredState sql.NullString
	if err := row.Scan(&desiredState); err != nil {
		return "", err
	}

	if desiredState.Valid {
		return desiredState.String, nil
	}

	return DesiredStopped, nil
}

func (r *NeuronRepository) GetStateByID(id int64) (*NeuronState, error) {
	row := r.DB.QueryRow(`
        SELECT last_connection, ping_timing
        FROM neurons
        WHERE id = ?
    `, id)

	var lastConnStr string
	var pingTiming int

	if err := row.Scan(&lastConnStr, &pingTiming); err != nil {
		return nil, err
	}

	lastConn, err := time.Parse(time.RFC3339, lastConnStr)
	if err != nil {
		return nil, err
	}

	expiry := lastConn.Add(time.Duration(pingTiming) * time.Second)

	state := "offline"
	if time.Now().Before(expiry) {
		state = "online"
	}

	return &NeuronState{
		ID:    id,
		State: state,
	}, nil
}

func isValidState(state string) bool {
	return state == DesiredRunning || state == DesiredStopped
}
