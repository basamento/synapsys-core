package main

import (
	"log"
	"net/http"
	"os"

	"synapsys-core-go/backend/internal/router"
	"synapsys-core-go/backend/internal/staticfs"
)

func main() {

	// Static files
	static := staticfs.Static()

	mux := router.New()

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
