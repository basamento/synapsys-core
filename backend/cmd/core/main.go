package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"synapsys-core-go/backend/internal/db"
	"synapsys-core-go/backend/internal/repository"
	"synapsys-core-go/backend/internal/router"
	"synapsys-core-go/backend/internal/staticfs"
)

func main() {

	// ---- DB init ----
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./data/app.db"
	}

	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		log.Fatalf("create data dir: %v", err)
	}

	dbConn, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}

	if err := db.InitSchema(dbConn); err != nil {
		log.Fatalf("init schema: %v", err)
	}

	repo := repository.NewNeuronRepository(dbConn)

	// Static files
	static := staticfs.Static()

	mux := router.New(repo)

	// Serve /static
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.FS(static))))

	// Serve index.html
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		data, err := staticfs.Embedded.ReadFile("static/index.html")
		if err != nil {
			http.Error(w, "index.html not found", 500)
			return
		}
		w.WriteHeader(200)
		w.Write(data)
	})

	// Port
	port := os.Getenv("PORT")
	if port == "" {
		port = "50166"
	}
	addr := ":" + port

	log.Printf("Synapsys Core running on %s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}
