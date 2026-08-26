package auth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

const (
	sessionCookieName = "synapsys_session"
	csrfCookieName    = "synapsys_csrf"
	sessionTTL        = 12 * time.Hour
)

// Config controls the operator session and the optional worker credential.
// Authentication is disabled only when SYNAPSYS_AUTH_DISABLED is explicitly
// set to true. The first enabled startup requires username and password when
// the persistent auth_users table is empty.
type Config struct {
	Disabled     bool
	Username     string
	Password     string
	WorkerToken  string
	CookieSecure bool
}

func LoadConfig() (Config, error) {
	disabled, err := envBool("SYNAPSYS_AUTH_DISABLED", false)
	if err != nil {
		return Config{}, err
	}

	password := os.Getenv("SYNAPSYS_AUTH_PASSWORD")
	if passwordFile := os.Getenv("SYNAPSYS_AUTH_PASSWORD_FILE"); passwordFile != "" {
		contents, err := os.ReadFile(passwordFile)
		if err != nil {
			return Config{}, fmt.Errorf("read SYNAPSYS_AUTH_PASSWORD_FILE: %w", err)
		}
		password = strings.TrimRight(string(contents), "\r\n")
	}

	cookieSecure, err := envBool("SYNAPSYS_AUTH_COOKIE_SECURE", false)
	if err != nil {
		return Config{}, err
	}

	return Config{
		Disabled:     disabled,
		Username:     strings.TrimSpace(os.Getenv("SYNAPSYS_AUTH_USERNAME")),
		Password:     password,
		WorkerToken:  os.Getenv("SYNAPSYS_WORKER_TOKEN"),
		CookieSecure: cookieSecure,
	}, nil
}

func envBool(name string, fallback bool) (bool, error) {
	value := os.Getenv(name)
	if value == "" {
		return fallback, nil
	}
	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return false, fmt.Errorf("%s must be true or false", name)
	}
	return parsed, nil
}

// Service owns the persisted bootstrap credential and signs short-lived
// browser sessions. The signing key is intentionally process-local, so a
// restart invalidates all browser sessions without storing session secrets.
type Service struct {
	db           *sql.DB
	username     string
	passwordHash []byte
	workerToken  string
	cookieSecure bool
	signingKey   []byte
	disabled     bool
}

func NewService(database *sql.DB, config Config) (*Service, error) {
	signingKey := make([]byte, 32)
	if _, err := rand.Read(signingKey); err != nil {
		return nil, fmt.Errorf("generate session signing key: %w", err)
	}

	service := &Service{
		db:           database,
		workerToken:  config.WorkerToken,
		cookieSecure: config.CookieSecure,
		signingKey:   signingKey,
		disabled:     config.Disabled,
	}
	if config.Disabled {
		return service, nil
	}

	var username string
	var passwordHash string
	err := database.QueryRow("SELECT username, password_hash FROM auth_users LIMIT 1").Scan(&username, &passwordHash)
	switch {
	case errors.Is(err, sql.ErrNoRows):
		if config.Username == "" || config.Password == "" {
			return nil, errors.New("authentication is not initialized: set SYNAPSYS_AUTH_USERNAME and SYNAPSYS_AUTH_PASSWORD")
		}
		if len(config.Username) > 128 {
			return nil, errors.New("SYNAPSYS_AUTH_USERNAME is too long")
		}
		hash, hashErr := bcrypt.GenerateFromPassword([]byte(config.Password), bcrypt.DefaultCost)
		if hashErr != nil {
			return nil, fmt.Errorf("hash initial authentication password: %w", hashErr)
		}
		if _, insertErr := database.Exec(
			"INSERT INTO auth_users (username, password_hash) VALUES (?, ?)",
			config.Username,
			string(hash),
		); insertErr != nil {
			return nil, fmt.Errorf("store initial authentication user: %w", insertErr)
		}
		username = config.Username
		passwordHash = string(hash)
	case err != nil:
		return nil, fmt.Errorf("load authentication user: %w", err)
	}

	service.username = username
	service.passwordHash = []byte(passwordHash)
	return service, nil
}

// Register adds the public authentication endpoints to the application mux.
func (s *Service) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/auth/login", s.login)
	mux.HandleFunc("GET /api/auth/session", s.session)
	mux.HandleFunc("POST /api/auth/logout", s.logout)
}

// RegisterWorkerTokenRoutes adds the UI-protected token management endpoints.
func (s *Service) RegisterWorkerTokenRoutes(mux *http.ServeMux, requireUI func(http.Handler) http.Handler) {
	mux.Handle("GET /api/auth/worker-tokens", requireUI(http.HandlerFunc(s.listWorkerTokens)))
	mux.Handle("POST /api/auth/worker-tokens", requireUI(http.HandlerFunc(s.createWorkerToken)))
	mux.Handle("DELETE /api/auth/worker-tokens/{id}", requireUI(http.HandlerFunc(s.revokeWorkerToken)))
}

func (s *Service) RequireUI(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if s.disabled || r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}

		if !s.validSession(r) {
			writeUnauthorized(w)
			return
		}

		if unsafeMethod(r.Method) && !s.validCSRF(r) {
			http.Error(w, "invalid CSRF token", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// RequireWorker protects every worker heartbeat with either a UI-generated
// token or the optional SYNAPSYS_WORKER_TOKEN deployment credential.
func (s *Service) RequireWorker(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if s.disabled || r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}

		if !s.validWorkerToken(bearerToken(r)) {
			writeUnauthorized(w)
			return
		}
		next.ServeHTTP(w, r)
	})
}

type workerTokenMetadata struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	CreatedAt  string  `json:"createdAt"`
	LastUsedAt *string `json:"lastUsedAt,omitempty"`
	RevokedAt  *string `json:"revokedAt,omitempty"`
}

func (s *Service) listWorkerTokens(w http.ResponseWriter, _ *http.Request) {
	rows, err := s.db.Query(`
		SELECT id, name, created_at, last_used_at, revoked_at
		FROM worker_tokens
		ORDER BY created_at DESC, id DESC
	`)
	if err != nil {
		http.Error(w, "unable to load worker tokens", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	tokens := make([]workerTokenMetadata, 0)
	for rows.Next() {
		var token workerTokenMetadata
		var lastUsedAt, revokedAt sql.NullString
		if err := rows.Scan(&token.ID, &token.Name, &token.CreatedAt, &lastUsedAt, &revokedAt); err != nil {
			http.Error(w, "unable to load worker tokens", http.StatusInternalServerError)
			return
		}
		if lastUsedAt.Valid {
			token.LastUsedAt = &lastUsedAt.String
		}
		if revokedAt.Valid {
			token.RevokedAt = &revokedAt.String
		}
		tokens = append(tokens, token)
	}
	if err := rows.Err(); err != nil {
		http.Error(w, "unable to load worker tokens", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, tokens)
}

func (s *Service) createWorkerToken(w http.ResponseWriter, r *http.Request) {
	var request struct {
		Name string `json:"name"`
	}
	if err := decodeJSON(w, r, &request); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	name := strings.TrimSpace(request.Name)
	if name == "" {
		name = "Worker token"
	}
	if len(name) > 128 {
		http.Error(w, "token name is too long", http.StatusBadRequest)
		return
	}

	id, err := randomToken(8)
	if err != nil {
		http.Error(w, "unable to create worker token", http.StatusInternalServerError)
		return
	}
	secret, err := randomToken(32)
	if err != nil {
		http.Error(w, "unable to create worker token", http.StatusInternalServerError)
		return
	}
	rawToken := "syn_" + id + "_" + secret
	hash := hashWorkerToken(rawToken)
	if _, err := s.db.Exec(
		"INSERT INTO worker_tokens (id, name, token_hash) VALUES (?, ?, ?)",
		id,
		name,
		hash,
	); err != nil {
		http.Error(w, "unable to store worker token", http.StatusInternalServerError)
		return
	}

	var createdAt string
	if err := s.db.QueryRow("SELECT created_at FROM worker_tokens WHERE id = ?", id).Scan(&createdAt); err != nil {
		http.Error(w, "unable to load worker token", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{
		"id":        id,
		"name":      name,
		"createdAt": createdAt,
		"token":     rawToken,
	})
}

func (s *Service) revokeWorkerToken(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimSpace(r.PathValue("id"))
	if id == "" {
		http.Error(w, "invalid token id", http.StatusBadRequest)
		return
	}
	result, err := s.db.Exec(
		"UPDATE worker_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id = ? AND revoked_at IS NULL",
		id,
	)
	if err != nil {
		http.Error(w, "unable to revoke worker token", http.StatusInternalServerError)
		return
	}
	if affected, _ := result.RowsAffected(); affected == 0 {
		http.Error(w, "worker token not found or already revoked", http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Service) login(w http.ResponseWriter, r *http.Request) {
	if s.disabled {
		writeJSON(w, http.StatusOK, map[string]any{"authenticated": true})
		return
	}

	var request struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := decodeJSON(w, r, &request); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	if request.Username != s.username || bcrypt.CompareHashAndPassword(s.passwordHash, []byte(request.Password)) != nil {
		http.Error(w, "invalid username or password", http.StatusUnauthorized)
		return
	}

	csrfToken, err := randomToken(32)
	if err != nil {
		http.Error(w, "unable to create session", http.StatusInternalServerError)
		return
	}
	setCookie(w, s.sessionCookie(request.Username))
	setCookie(w, s.csrfCookie(csrfToken))
	writeJSON(w, http.StatusOK, map[string]any{"authenticated": true, "username": s.username})
}

func (s *Service) session(w http.ResponseWriter, r *http.Request) {
	username, valid := s.sessionUsername(r)
	if s.disabled {
		writeJSON(w, http.StatusOK, map[string]any{"authenticated": true})
		return
	}
	if !valid {
		writeUnauthorized(w)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"authenticated": true, "username": username})
}

func (s *Service) logout(w http.ResponseWriter, r *http.Request) {
	setCookie(w, s.expiredCookie(sessionCookieName, true))
	setCookie(w, s.expiredCookie(csrfCookieName, false))
	w.WriteHeader(http.StatusNoContent)
}

func (s *Service) validSession(r *http.Request) bool {
	_, valid := s.sessionUsername(r)
	return valid
}

func (s *Service) sessionUsername(r *http.Request) (string, bool) {
	cookie, err := r.Cookie(sessionCookieName)
	if err != nil {
		return "", false
	}
	parts := strings.Split(cookie.Value, ".")
	if len(parts) != 2 {
		return "", false
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return "", false
	}
	mac := hmac.New(sha256.New, s.signingKey)
	_, _ = mac.Write(payload)
	signature, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil || !hmac.Equal(signature, mac.Sum(nil)) {
		return "", false
	}

	var session struct {
		Username string `json:"username"`
		Expires  int64  `json:"expires"`
	}
	if json.Unmarshal(payload, &session) != nil || session.Username != s.username || session.Expires <= time.Now().Unix() {
		return "", false
	}
	return session.Username, true
}

func (s *Service) validCSRF(r *http.Request) bool {
	provided := r.Header.Get("X-CSRF-Token")
	cookie, err := r.Cookie(csrfCookieName)
	return err == nil && provided != "" && hmac.Equal([]byte(provided), []byte(cookie.Value))
}

func (s *Service) validWorkerToken(provided string) bool {
	if provided == "" {
		return false
	}
	if s.workerToken != "" && hmac.Equal([]byte(provided), []byte(s.workerToken)) {
		return true
	}

	var id string
	if err := s.db.QueryRow(
		"SELECT id FROM worker_tokens WHERE token_hash = ? AND revoked_at IS NULL",
		hashWorkerToken(provided),
	).Scan(&id); err != nil {
		return false
	}
	_, _ = s.db.Exec("UPDATE worker_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?", id)
	return true
}

func bearerToken(r *http.Request) string {
	const prefix = "Bearer "
	authorization := strings.TrimSpace(r.Header.Get("Authorization"))
	if !strings.HasPrefix(authorization, prefix) {
		return ""
	}
	return strings.TrimSpace(strings.TrimPrefix(authorization, prefix))
}

func hashWorkerToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return base64.RawURLEncoding.EncodeToString(hash[:])
}

func (s *Service) sessionCookie(username string) *http.Cookie {
	payload, _ := json.Marshal(map[string]any{"username": username, "expires": time.Now().Add(sessionTTL).Unix()})
	encoded := base64.RawURLEncoding.EncodeToString(payload)
	mac := hmac.New(sha256.New, s.signingKey)
	_, _ = mac.Write(payload)
	return &http.Cookie{
		Name:     sessionCookieName,
		Value:    encoded + "." + base64.RawURLEncoding.EncodeToString(mac.Sum(nil)),
		Path:     "/",
		HttpOnly: true,
		Secure:   s.cookieSecure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(sessionTTL.Seconds()),
	}
}

func (s *Service) csrfCookie(token string) *http.Cookie {
	return &http.Cookie{
		Name:     csrfCookieName,
		Value:    token,
		Path:     "/",
		Secure:   s.cookieSecure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(sessionTTL.Seconds()),
	}
}

func (s *Service) expiredCookie(name string, secure bool) *http.Cookie {
	return &http.Cookie{Name: name, Value: "", Path: "/", Secure: secure && s.cookieSecure, HttpOnly: secure, SameSite: http.SameSiteLaxMode, MaxAge: -1}
}

func randomToken(size int) (string, error) {
	bytes := make([]byte, size)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

func decodeJSON(w http.ResponseWriter, r *http.Request, destination any) error {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(destination); err != nil {
		return err
	}
	var extra any
	if err := decoder.Decode(&extra); !errors.Is(err, io.EOF) {
		return errors.New("request contains more than one JSON value")
	}
	return nil
}

func setCookie(w http.ResponseWriter, cookie *http.Cookie) {
	http.SetCookie(w, cookie)
}

func unsafeMethod(method string) bool {
	return method == http.MethodPost || method == http.MethodPut || method == http.MethodPatch || method == http.MethodDelete
}

func writeUnauthorized(w http.ResponseWriter) {
	http.Error(w, "authentication required", http.StatusUnauthorized)
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
