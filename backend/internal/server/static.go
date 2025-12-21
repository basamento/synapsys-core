package server

import (
	"embed"
	"net/http"
	"strings"
)

//go:embed dist/*
var staticFiles embed.FS

func RegisterEmbeddedStatic(mux *http.ServeMux) {
	fs := http.FS(staticFiles)
	fileServer := http.FileServer(fs)

	mux.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Let API routes pass through
		if strings.HasPrefix(r.URL.Path, "/api") {
			http.NotFound(w, r)
			return
		}

		// SPA fallback
		_, err := fs.Open("dist" + r.URL.Path)
		if err != nil {
			r.URL.Path = "/dist/index.html"
		}

		fileServer.ServeHTTP(w, r)
	}))
}
