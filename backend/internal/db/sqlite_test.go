package db

import (
	"context"
	"database/sql"
	"errors"
	"path/filepath"
	"testing"

	modernsqlite "modernc.org/sqlite"
)

func TestOpenConfiguresEveryConnection(t *testing.T) {
	database, err := Open("file:" + filepath.ToSlash(filepath.Join(t.TempDir(), "configured.db")))
	if err != nil {
		t.Fatalf("open database: %v", err)
	}
	t.Cleanup(func() { _ = database.Close() })
	database.SetMaxOpenConns(2)

	first, err := database.Conn(t.Context())
	if err != nil {
		t.Fatalf("open first connection: %v", err)
	}
	t.Cleanup(func() { _ = first.Close() })
	second, err := database.Conn(t.Context())
	if err != nil {
		t.Fatalf("open second connection: %v", err)
	}
	t.Cleanup(func() { _ = second.Close() })

	for name, connection := range map[string]*sql.Conn{"first": first, "second": second} {
		t.Run(name, func(t *testing.T) {
			assertPragmaInt(t, connection, "busy_timeout", 5000)
			assertPragmaText(t, connection, "journal_mode", "wal")
			assertPragmaInt(t, connection, "foreign_keys", 1)
		})
	}
}

func TestFailedBusyCommitDoesNotPoisonConnection(t *testing.T) {
	path := filepath.ToSlash(filepath.Join(t.TempDir(), "commit-busy.db"))
	open := func(t *testing.T) *sql.DB {
		database, err := sql.Open("sqlite", "file:"+path)
		if err != nil {
			t.Fatalf("open database: %v", err)
		}
		database.SetMaxOpenConns(1)
		t.Cleanup(func() { _ = database.Close() })
		return database
	}

	writer := open(t)
	reader := open(t)
	if _, err := writer.Exec("CREATE TABLE values_table (value INTEGER PRIMARY KEY)"); err != nil {
		t.Fatalf("create table: %v", err)
	}

	writeTx, err := writer.BeginTx(t.Context(), nil)
	if err != nil {
		t.Fatalf("begin writer: %v", err)
	}
	readTx, err := reader.BeginTx(t.Context(), nil)
	if err != nil {
		t.Fatalf("begin reader: %v", err)
	}
	defer readTx.Rollback()

	rows, err := readTx.QueryContext(t.Context(), "SELECT value FROM values_table")
	if err != nil {
		t.Fatalf("hold read lock: %v", err)
	}
	defer rows.Close()
	if _, err := writeTx.ExecContext(t.Context(), "INSERT INTO values_table(value) VALUES (42)"); err != nil {
		t.Fatalf("write row: %v", err)
	}

	err = writeTx.Commit()
	if err == nil {
		t.Fatal("commit unexpectedly succeeded while another connection held a read lock")
	}
	var sqliteErr *modernsqlite.Error
	if !errors.As(err, &sqliteErr) || sqliteErr.Code()&0xff != 5 {
		t.Fatalf("commit error = %T %v, want SQLITE_BUSY", err, err)
	}
	if err := writeTx.Rollback(); !errors.Is(err, sql.ErrTxDone) {
		t.Fatalf("rollback after commit = %v, want sql.ErrTxDone", err)
	}

	if err := rows.Close(); err != nil {
		t.Fatalf("close reader rows: %v", err)
	}
	if err := readTx.Rollback(); err != nil {
		t.Fatalf("release read lock: %v", err)
	}

	nextTx, err := writer.BeginTx(t.Context(), nil)
	if err != nil {
		t.Fatalf("connection remained poisoned after failed commit: %v", err)
	}
	if err := nextTx.Rollback(); err != nil {
		t.Fatalf("rollback verification transaction: %v", err)
	}

	var count int
	if err := writer.QueryRow("SELECT COUNT(*) FROM values_table").Scan(&count); err != nil {
		t.Fatalf("read after failed commit: %v", err)
	}
	if count != 0 {
		t.Fatalf("failed transaction left %d rows, want 0", count)
	}
}

func assertPragmaInt(t *testing.T, connection *sql.Conn, pragma string, want int) {
	t.Helper()
	var got int
	if err := connection.QueryRowContext(context.Background(), "PRAGMA "+pragma).Scan(&got); err != nil {
		t.Fatalf("read PRAGMA %s: %v", pragma, err)
	}
	if got != want {
		t.Fatalf("PRAGMA %s = %d, want %d", pragma, got, want)
	}
}

func assertPragmaText(t *testing.T, connection *sql.Conn, pragma, want string) {
	t.Helper()
	var got string
	if err := connection.QueryRowContext(context.Background(), "PRAGMA "+pragma).Scan(&got); err != nil {
		t.Fatalf("read PRAGMA %s: %v", pragma, err)
	}
	if got != want {
		t.Fatalf("PRAGMA %s = %q, want %q", pragma, got, want)
	}
}
