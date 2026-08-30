package db

import (
	"database/sql"
	"testing"
)

func TestEnsureWorkerTokenColumnsRepairsLegacyTable(t *testing.T) {
	database, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = database.Close() })

	if _, err := database.Exec(`
		CREATE TABLE worker_tokens (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			token_hash TEXT NOT NULL UNIQUE,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`); err != nil {
		t.Fatal(err)
	}

	if err := ensureWorkerTokenColumns(database); err != nil {
		t.Fatal(err)
	}
	if err := ensureWorkerTokenColumns(database); err != nil {
		t.Fatalf("second reconciliation should be idempotent: %v", err)
	}

	columns := workerTokenColumnNames(t, database)
	for _, expected := range []string{"last_used_at", "revoked_at"} {
		if !columns[expected] {
			t.Fatalf("worker_tokens is missing repaired column %q", expected)
		}
	}
}

func workerTokenColumnNames(t *testing.T, database *sql.DB) map[string]bool {
	t.Helper()
	rows, err := database.Query("PRAGMA table_info(worker_tokens)")
	if err != nil {
		t.Fatal(err)
	}
	defer rows.Close()

	columns := make(map[string]bool)
	for rows.Next() {
		var cid, notNull, primaryKey int
		var name, columnType string
		var defaultValue sql.NullString
		if err := rows.Scan(&cid, &name, &columnType, &notNull, &defaultValue, &primaryKey); err != nil {
			t.Fatal(err)
		}
		columns[name] = true
	}
	if err := rows.Err(); err != nil {
		t.Fatal(err)
	}
	return columns
}
