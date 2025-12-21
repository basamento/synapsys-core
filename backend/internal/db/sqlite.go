package db

import (
	"database/sql"

	_ "modernc.org/sqlite"
)

func Open(path string) (*sql.DB, error) {
	// try connection
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	// try ping
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, err
	}
	return db, nil
}
