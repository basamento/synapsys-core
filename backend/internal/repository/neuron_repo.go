package repository

import (
	"database/sql"
	"strings"
)

type Neuron struct {
	ID             int64  `json:"id"`
	Name           string `json:"name"`
	CreatedAt      string `json:"created_at"`
	LastConnection string `json:"last_connection"`
}

type NeuronRepository struct {
	DB *sql.DB
}

func NewNeuronRepository(db *sql.DB) *NeuronRepository {
	return &NeuronRepository{DB: db}
}

func (r *NeuronRepository) Create(name string) (*Neuron, error) {
	res, err := r.DB.Exec(`INSERT INTO neurons (name) VALUES (?)`, name)
	if err != nil {
		return nil, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	return &Neuron{
		ID:   id,
		Name: name,
	}, nil
}

func (r *NeuronRepository) CreateOrUpdate(name string) (*Neuron, error) {

	_, err := r.DB.Exec(`
        INSERT INTO neurons (name) 
        VALUES (?)
    `, name)

	if err != nil {
		msg := err.Error()

		// Handle UNIQUE constraint error
		if strings.Contains(strings.ToLower(msg), "unique") {

			_, err := r.DB.Exec(`
                UPDATE neurons
                SET last_connection = CURRENT_TIMESTAMP
                WHERE name = ?
            `, name)

			if err != nil {
				return nil, err
			}

		} else {
			return nil, err
		}
	}

	// Fetch updated/created record
	row := r.DB.QueryRow(`
        SELECT id, name, created_at, last_connection
        FROM neurons
        WHERE name = ?
    `, name)

	var n Neuron
	err = row.Scan(&n.ID, &n.Name, &n.CreatedAt, &n.LastConnection)
	if err != nil {
		return nil, err
	}

	return &n, nil
}

func (r *NeuronRepository) ListAll() ([]Neuron, error) {
	rows, err := r.DB.Query(`
        SELECT id, name, created_at, last_connection
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
		); err != nil {
			return nil, err
		}
		list = append(list, n)
	}
	return list, nil
}
