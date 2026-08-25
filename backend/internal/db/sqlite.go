package db

import (
	"database/sql"
	"os"
	"path/filepath"
	"strings"

	_ "modernc.org/sqlite"
)

func Open(path string) (*sql.DB, error) {
	// The database file is not shipped: make sure its directory exists first.
	if err := ensureDir(path); err != nil {
		return nil, err
	}
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

// ensureDir creates the parent directory of a SQLite DSN such as
// "file:data/nucleus.db?_foreign_keys=on".
func ensureDir(dsn string) error {
	path := strings.TrimPrefix(dsn, "file:")
	if i := strings.IndexByte(path, '?'); i >= 0 {
		path = path[:i]
	}
	if path == "" || path == ":memory:" {
		return nil
	}
	dir := filepath.Dir(path)
	if dir == "" || dir == "." {
		return nil
	}
	return os.MkdirAll(dir, 0o755)
}
