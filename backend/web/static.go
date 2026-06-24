package web

import (
	"embed"
	"io/fs"
	"net/http"
	"strings"
)

//go:embed dist/*
var embeddedFiles embed.FS

func RegisterEmbeddedStatic(mux *http.ServeMux) {
	dist, err := fs.Sub(embeddedFiles, "dist")
	if err != nil {
		panic(err)
	}

	fileServer := http.FileServer(http.FS(dist))

	mux.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api" || strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}

		path := strings.TrimPrefix(r.URL.Path, "/")
		if path == "" {
			serveIndex(w, dist)
			return
		}

		file, err := dist.Open(path)
		if err != nil {
			serveIndex(w, dist)
			return
		}
		_ = file.Close()

		fileServer.ServeHTTP(w, r)
	}))
}

func serveIndex(w http.ResponseWriter, dist fs.FS) {
	index, err := fs.ReadFile(dist, "index.html")
	if err != nil {
		http.Error(w, "index not found", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(index)
}
