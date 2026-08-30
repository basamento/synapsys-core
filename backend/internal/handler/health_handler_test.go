package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"synapsys-core/internal/db"
	"synapsys-core/internal/domain"
	"synapsys-core/internal/service"
)

func TestHealthHandlerChecksDatabase(t *testing.T) {
	tests := []struct {
		name       string
		closeDB    bool
		wantStatus int
		wantHealth string
	}{
		{name: "healthy", wantStatus: http.StatusOK, wantHealth: "ok"},
		{name: "database unavailable", closeDB: true, wantStatus: http.StatusServiceUnavailable, wantHealth: "unhealthy"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			database, err := db.Open("file:" + filepath.ToSlash(filepath.Join(t.TempDir(), "health.db")))
			if err != nil {
				t.Fatalf("open database: %v", err)
			}
			if err := db.RunMigrations(database); err != nil {
				t.Fatalf("run migrations: %v", err)
			}
			if test.closeDB {
				if err := database.Close(); err != nil {
					t.Fatalf("close database: %v", err)
				}
			} else {
				t.Cleanup(func() { _ = database.Close() })
			}

			handler := NewHealthHandler(service.NewHealthService(database))
			response := httptest.NewRecorder()
			handler.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/api/health", nil))

			if response.Code != test.wantStatus {
				t.Fatalf("status = %d, want %d", response.Code, test.wantStatus)
			}
			var health domain.HealthStatus
			if err := json.NewDecoder(response.Body).Decode(&health); err != nil {
				t.Fatalf("decode response: %v", err)
			}
			if health.Status != test.wantHealth {
				t.Fatalf("health status = %q, want %q", health.Status, test.wantHealth)
			}
		})
	}
}
