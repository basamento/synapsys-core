package db

import (
	"database/sql"

	_ "modernc.org/sqlite"
)

func InitSchema(db *sql.DB) error {
	_, err := db.Exec(`
        CREATE TABLE IF NOT EXISTS neurons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_connection DATETIME DEFAULT CURRENT_TIMESTAMP,
            desired_state TEXT NOT NULL DEFAULT 'STOPPED',
            ping_timing INTEGER NOT NULL
        );
    `)
	return err
}
