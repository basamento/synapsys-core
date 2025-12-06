package main

import (
    "database/sql"
    _ "github.com/mattn/go-sqlite3"
)

func initSchema(db *sql.DB) error {
    // simple example table
    _, err := db.Exec(`
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            done BOOLEAN NOT NULL DEFAULT 0
        );
    `)
    return err
}
