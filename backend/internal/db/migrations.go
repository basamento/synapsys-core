package db

import (
	"database/sql"
	"embed"
	"fmt"
	"sort"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

const createLedger = `
CREATE TABLE IF NOT EXISTS schema_migrations (
    version    TEXT PRIMARY KEY,
    applied_at DATETIME NOT NULL
)`

// RunMigrations applies every embedded migration exactly once, in filename order,
// recording each one in schema_migrations. Files are executed outside an explicit
// transaction so that a migration may use PRAGMA statements (notably
// foreign_keys), which are no-ops inside a transaction.
func RunMigrations(db *sql.DB) error {
	if _, err := db.Exec(createLedger); err != nil {
		return fmt.Errorf("create schema_migrations: %w", err)
	}

	applied, err := appliedVersions(db)
	if err != nil {
		return err
	}

	entries, err := migrationsFS.ReadDir("migrations")
	if err != nil {
		return err
	}
	// Ensure deterministic order
	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Name() < entries[j].Name()
	})

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		version := entry.Name()
		if applied[version] {
			continue
		}

		sqlBytes, err := migrationsFS.ReadFile("migrations/" + version)
		if err != nil {
			return err
		}
		if _, err := db.Exec(string(sqlBytes)); err != nil {
			return fmt.Errorf("apply migration %s: %w", version, err)
		}
		if _, err := db.Exec(
			"INSERT INTO schema_migrations (version, applied_at) VALUES (?, CURRENT_TIMESTAMP)",
			version,
		); err != nil {
			return fmt.Errorf("record migration %s: %w", version, err)
		}
	}
	return ensureWorkerTokenColumns(db)
}

// ensureWorkerTokenColumns repairs databases created by an early worker-token
// schema that predated last-used tracking and revocation. Migration 0005 uses
// CREATE TABLE IF NOT EXISTS, which cannot add columns to that existing table.
// Keeping this reconciliation idempotent makes upgrades safe for both schemas.
func ensureWorkerTokenColumns(db *sql.DB) error {
	rows, err := db.Query("PRAGMA table_info(worker_tokens)")
	if err != nil {
		return fmt.Errorf("inspect worker_tokens columns: %w", err)
	}
	columns := make(map[string]bool)
	for rows.Next() {
		var cid, notNull, primaryKey int
		var name, columnType string
		var defaultValue sql.NullString
		if err := rows.Scan(&cid, &name, &columnType, &notNull, &defaultValue, &primaryKey); err != nil {
			rows.Close()
			return fmt.Errorf("read worker_tokens column: %w", err)
		}
		columns[name] = true
	}
	if err := rows.Close(); err != nil {
		return fmt.Errorf("close worker_tokens columns: %w", err)
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("iterate worker_tokens columns: %w", err)
	}

	for _, column := range []string{"last_used_at", "revoked_at"} {
		if columns[column] {
			continue
		}
		if _, err := db.Exec("ALTER TABLE worker_tokens ADD COLUMN " + column + " DATETIME NULL"); err != nil {
			return fmt.Errorf("add worker_tokens.%s: %w", column, err)
		}
	}
	return nil
}

func appliedVersions(db *sql.DB) (map[string]bool, error) {
	rows, err := db.Query("SELECT version FROM schema_migrations")
	if err != nil {
		return nil, fmt.Errorf("read schema_migrations: %w", err)
	}
	defer rows.Close()

	applied := make(map[string]bool)
	for rows.Next() {
		var version string
		if err := rows.Scan(&version); err != nil {
			return nil, err
		}
		applied[version] = true
	}
	return applied, rows.Err()
}
