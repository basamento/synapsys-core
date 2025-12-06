package main

import (
	"database/sql"
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

// Embed contents of static folder
//
//go:embed static/*
var staticFS embed.FS

var db *sql.DB

func main() {
	// ---- DB init ----
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./data/app.db"
	}

	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		log.Fatalf("create data dir: %v", err)
	}

	var err error
	db, err = sql.Open("sqlite3", dbPath+"?_foreign_keys=on&_journal_mode=WAL")
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	if err := initSchema(db); err != nil {
		log.Fatalf("init schema: %v", err)
	}

	// Extract /static folder into fs.FS
	staticContent, _ := fs.Sub(staticFS, "static")

	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/todos", todosHandler)

	// FileServer for /static
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.FS(staticContent))))

	// Serve index.html for "/"
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		data, err := fs.ReadFile(staticContent, "index.html") // FIXED
		if err != nil {
			http.Error(w, "index.html not found", 500)
			return
		}
		w.Header().Set("Content-Type", "text/html")
		w.Write(data)
	})

	addr := ":8080"
	if env := os.Getenv("PORT"); env != "" {
		addr = ":" + env
	}

	log.Printf("listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
