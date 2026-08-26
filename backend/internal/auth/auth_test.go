package auth

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"synapsys-core/internal/db"
)

func newTestService(t *testing.T, config Config) *Service {
	t.Helper()
	database, err := db.Open("file:" + filepath.ToSlash(filepath.Join(t.TempDir(), "nucleus.db")) + "?_foreign_keys=on")
	if err != nil {
		t.Fatalf("open database: %v", err)
	}
	t.Cleanup(func() { _ = database.Close() })
	if err := db.RunMigrations(database); err != nil {
		t.Fatalf("run migrations: %v", err)
	}
	service, err := NewService(database, config)
	if err != nil {
		t.Fatalf("new auth service: %v", err)
	}
	return service
}

func TestLoginSessionAndCSRF(t *testing.T) {
	service := newTestService(t, Config{Username: "operator", Password: "secret"})
	mux := http.NewServeMux()
	service.Register(mux)
	mux.Handle("GET /protected", service.RequireUI(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})))
	mux.Handle("PUT /protected", service.RequireUI(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})))

	unauthenticated := httptest.NewRecorder()
	mux.ServeHTTP(unauthenticated, httptest.NewRequest(http.MethodGet, "/protected", nil))
	if unauthenticated.Code != http.StatusUnauthorized {
		t.Fatalf("unauthenticated status = %d, want %d", unauthenticated.Code, http.StatusUnauthorized)
	}

	login := httptest.NewRecorder()
	mux.ServeHTTP(login, httptest.NewRequest(http.MethodPost, "/api/auth/login", strings.NewReader(`{"username":"operator","password":"secret"}`)))
	if login.Code != http.StatusOK {
		t.Fatalf("login status = %d, want %d", login.Code, http.StatusOK)
	}
	cookies := login.Result().Cookies()
	if len(cookies) != 2 {
		t.Fatalf("login cookies = %d, want session and CSRF cookies", len(cookies))
	}

	withSession := httptest.NewRequest(http.MethodGet, "/protected", nil)
	for _, cookie := range cookies {
		withSession.AddCookie(cookie)
	}
	protected := httptest.NewRecorder()
	mux.ServeHTTP(protected, withSession)
	if protected.Code != http.StatusNoContent {
		t.Fatalf("protected status = %d, want %d", protected.Code, http.StatusNoContent)
	}

	withoutCSRF := httptest.NewRequest(http.MethodPut, "/protected", nil)
	for _, cookie := range cookies {
		withoutCSRF.AddCookie(cookie)
	}
	csrfFailure := httptest.NewRecorder()
	mux.ServeHTTP(csrfFailure, withoutCSRF)
	if csrfFailure.Code != http.StatusForbidden {
		t.Fatalf("missing CSRF status = %d, want %d", csrfFailure.Code, http.StatusForbidden)
	}

	withCSRF := httptest.NewRequest(http.MethodPut, "/protected", nil)
	for _, cookie := range cookies {
		withCSRF.AddCookie(cookie)
		if cookie.Name == csrfCookieName {
			withCSRF.Header.Set("X-CSRF-Token", cookie.Value)
		}
	}
	csrfSuccess := httptest.NewRecorder()
	mux.ServeHTTP(csrfSuccess, withCSRF)
	if csrfSuccess.Code != http.StatusNoContent {
		t.Fatalf("valid CSRF status = %d, want %d", csrfSuccess.Code, http.StatusNoContent)
	}
}

func TestBootstrapCredentialIsPersistent(t *testing.T) {
	database, err := db.Open("file:" + filepath.ToSlash(filepath.Join(t.TempDir(), "nucleus.db")) + "?_foreign_keys=on")
	if err != nil {
		t.Fatalf("open database: %v", err)
	}
	defer database.Close()
	if err := db.RunMigrations(database); err != nil {
		t.Fatalf("run migrations: %v", err)
	}

	first, err := NewService(database, Config{Username: "first", Password: "one"})
	if err != nil {
		t.Fatalf("first service: %v", err)
	}
	second, err := NewService(database, Config{Username: "second", Password: "two"})
	if err != nil {
		t.Fatalf("second service: %v", err)
	}

	if first.username != second.username {
		t.Fatalf("persisted username = %q, want %q", second.username, first.username)
	}
	if second.passwordHash == nil {
		t.Fatal("persisted password hash is empty")
	}
}

func TestWorkerTokenIsIndependentFromUISession(t *testing.T) {
	service := newTestService(t, Config{Username: "operator", Password: "secret", WorkerToken: "worker-secret"})
	handler := service.RequireWorker(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	missing := httptest.NewRecorder()
	handler.ServeHTTP(missing, httptest.NewRequest(http.MethodPost, "/heartbeat", nil))
	if missing.Code != http.StatusUnauthorized {
		t.Fatalf("missing worker token status = %d, want %d", missing.Code, http.StatusUnauthorized)
	}

	request := httptest.NewRequest(http.MethodPost, "/heartbeat", nil)
	request.Header.Set("Authorization", "Bearer worker-secret")
	valid := httptest.NewRecorder()
	handler.ServeHTTP(valid, request)
	if valid.Code != http.StatusNoContent {
		t.Fatalf("valid worker token status = %d, want %d", valid.Code, http.StatusNoContent)
	}
}

func TestWorkerTokenIsRequiredWithoutConfiguredCredential(t *testing.T) {
	service := newTestService(t, Config{Username: "operator", Password: "secret"})
	handler := service.RequireWorker(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	request := httptest.NewRequest(http.MethodPost, "/heartbeat", nil)
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)

	if response.Code != http.StatusUnauthorized {
		t.Fatalf("missing worker token status = %d, want %d", response.Code, http.StatusUnauthorized)
	}
}

func TestGeneratedWorkerTokenCanAuthenticateAndBeRevoked(t *testing.T) {
	service := newTestService(t, Config{Username: "operator", Password: "secret"})
	mux := http.NewServeMux()
	service.RegisterWorkerTokenRoutes(mux, service.RequireUI)

	login := httptest.NewRecorder()
	loginRequest := httptest.NewRequest(http.MethodPost, "/api/auth/login", strings.NewReader(`{"username":"operator","password":"secret"}`))
	service.Register(mux)
	mux.ServeHTTP(login, loginRequest)
	if login.Code != http.StatusOK {
		t.Fatalf("login status = %d, want %d", login.Code, http.StatusOK)
	}

	var sessionCookie, csrfCookie *http.Cookie
	for _, cookie := range login.Result().Cookies() {
		if cookie.Name == sessionCookieName {
			sessionCookie = cookie
		}
		if cookie.Name == csrfCookieName {
			csrfCookie = cookie
		}
	}
	if sessionCookie == nil || csrfCookie == nil {
		t.Fatal("login did not return both session and CSRF cookies")
	}

	create := httptest.NewRequest(http.MethodPost, "/api/auth/worker-tokens", strings.NewReader(`{"name":"billing worker"}`))
	create.AddCookie(sessionCookie)
	create.AddCookie(csrfCookie)
	create.Header.Set("X-CSRF-Token", csrfCookie.Value)
	created := httptest.NewRecorder()
	mux.ServeHTTP(created, create)
	if created.Code != http.StatusCreated {
		t.Fatalf("create token status = %d, want %d", created.Code, http.StatusCreated)
	}

	var response struct {
		ID    string `json:"id"`
		Token string `json:"token"`
	}
	if err := json.NewDecoder(created.Body).Decode(&response); err != nil {
		t.Fatalf("decode created token: %v", err)
	}
	if response.ID == "" || response.Token == "" {
		t.Fatal("created token response did not contain an id and token")
	}

	worker := service.RequireWorker(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))
	workerRequest := httptest.NewRequest(http.MethodPost, "/heartbeat", nil)
	workerRequest.Header.Set("Authorization", "Bearer "+response.Token)
	workerResponse := httptest.NewRecorder()
	worker.ServeHTTP(workerResponse, workerRequest)
	if workerResponse.Code != http.StatusNoContent {
		t.Fatalf("generated token status = %d, want %d", workerResponse.Code, http.StatusNoContent)
	}

	revoke := httptest.NewRequest(http.MethodDelete, "/api/auth/worker-tokens/"+response.ID, nil)
	revoke.AddCookie(sessionCookie)
	revoke.AddCookie(csrfCookie)
	revoke.Header.Set("X-CSRF-Token", csrfCookie.Value)
	revoked := httptest.NewRecorder()
	mux.ServeHTTP(revoked, revoke)
	if revoked.Code != http.StatusNoContent {
		t.Fatalf("revoke token status = %d, want %d", revoked.Code, http.StatusNoContent)
	}

	afterRevoke := httptest.NewRecorder()
	worker.ServeHTTP(afterRevoke, workerRequest)
	if afterRevoke.Code != http.StatusUnauthorized {
		t.Fatalf("revoked token status = %d, want %d", afterRevoke.Code, http.StatusUnauthorized)
	}
}
