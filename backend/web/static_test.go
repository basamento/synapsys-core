package web

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestEmbeddedStaticDoesNotHandleAPIRoutes(t *testing.T) {
	mux := http.NewServeMux()
	RegisterEmbeddedStatic(mux)

	recorder := httptest.NewRecorder()
	mux.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/api/", nil))

	if recorder.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusNotFound)
	}
}

func TestEmbeddedStaticFallsBackToIndex(t *testing.T) {
	mux := http.NewServeMux()
	RegisterEmbeddedStatic(mux)

	recorder := httptest.NewRecorder()
	mux.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/workers", nil))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}
}
