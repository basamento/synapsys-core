package repository

import (
	"database/sql"
	"fmt"
)

const (
	DesiredRunning = "RUNNING"
	DesiredStopped = "STOPPED"
)

type Neuron struct {
	ID             int64  `json:"id"`
	Name           string `json:"name"`
	CreatedAt      string `json:"created_at"`
	LastConnection string `json:"last_connection"`
	DesiredState   string `json:"desired_state"`
}

type NeuronRepository struct {
	DB *sql.DB
}

func NewNeuronRepository(db *sql.DB) *NeuronRepository {
	return &NeuronRepository{DB: db}
}

func (r *NeuronRepository) CreateOrUpdate(name string) (*Neuron, error) {
	_, err := r.DB.Exec(`
        INSERT INTO neurons (name, last_connection)
        VALUES (?, CURRENT_TIMESTAMP)
        ON CONFLICT(name) DO UPDATE SET
            last_connection = CURRENT_TIMESTAMP
    `, name)
	if err != nil {
		return nil, err
	}

	row := r.DB.QueryRow(`
        SELECT id, name, created_at, last_connection, desired_state
        FROM neurons
        WHERE name = ?
    `, name)

	var n Neuron

	if err := row.Scan(
		&n.ID,
		&n.Name,
		&n.CreatedAt,
		&n.LastConnection,
		&n.DesiredState,
	); err != nil {
		return nil, err
	}

	return &n, nil
}

func (r *NeuronRepository) ListAll() ([]Neuron, error) {
	rows, err := r.DB.Query(`
        SELECT id, name, created_at, last_connection, desired_state
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
		if err := rows.Scan(
			&n.ID,
			&n.Name,
			&n.CreatedAt,
			&n.LastConnection,
			&n.DesiredState,
		); err != nil {
			return nil, err
		}
		list = append(list, n)
	}

	return list, nil
}

func (r *NeuronRepository) SetDesiredState(name string, state string) error {

	if state != DesiredRunning && state != DesiredStopped {
		return fmt.Errorf("invalid desired state: %s", state)
	}

	_, err := r.DB.Exec(`
        UPDATE neurons
        SET desired_state = ?
        WHERE name = ?
    `, state, name)

	return err

}

func (r *NeuronRepository) TouchLastConnection(name string) error {
	_, err := r.DB.Exec(`
        UPDATE neurons
        SET last_connection = CURRENT_TIMESTAMP
        WHERE name = ?
    `, name)

	return err
}
