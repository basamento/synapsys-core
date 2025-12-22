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
		path := strings.TrimPrefix(r.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}

		if _, err := dist.Open(path); err != nil {
			r.URL.Path = "/index.html"
		}

		fileServer.ServeHTTP(w, r)
	}))
}
