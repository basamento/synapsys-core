package service

import (
	"path/filepath"
	"synapsys-core/internal/db"
	"synapsys-core/internal/domain"
	"synapsys-core/internal/repository/sqlite"
	"testing"
	"time"
)

func TestHeartbeatLogsAreStoredAndDeduplicated(t *testing.T) {
	database, err := db.Open("file:" + filepath.ToSlash(filepath.Join(t.TempDir(), "nucleus.db")))
	if err != nil {
		t.Fatalf("open database: %v", err)
	}
	defer database.Close()
	if err := db.RunMigrations(database); err != nil {
		t.Fatalf("run migrations: %v", err)
	}

	repo := sqlite.NewProcessRepository(database)
	service := NewProcessService(repo)
	stateService := NewStateService(repo)
	base := HeartbeatRequest{
		WorkerName: "worker-logs",
		Framework:  domain.WorkerFrameworkSpringBoot,
		Host:       "localhost",
		PingTiming: 1,
		Processes: []ProcessHeartbeat{{
			Name: "process-logs", Type: domain.ProcessTypeProgressive,
			CurrentState: domain.ExecutionStateIdle,
		}},
	}
	if _, err := service.SyncProcesses(t.Context(), base); err != nil {
		t.Fatalf("initial sync: %v", err)
	}
	views, err := service.ListAllProcesses(t.Context())
	if err != nil || len(views.Processes) != 1 {
		t.Fatalf("list process: %v, views=%d", err, len(views.Processes))
	}
	processID := views.Processes[0].ID
	if _, err := service.UpdateDesiredState(t.Context(), UpdateDesiredStateRequest{
		ProcessID: processID, DesiredState: domain.ExecutionStateRunning,
	}); err != nil {
		t.Fatalf("start process: %v", err)
	}
	state, err := stateService.GetState(t.Context(), domain.StatePagination{
		Executions: domain.CollectionQuery{Page: 1, PageSize: 10},
	})
	if err != nil || len(state.Executions) != 1 || state.Executions[0].RunID == nil {
		t.Fatalf("load execution: %v, state=%#v", err, state.Executions)
	}
	runID := *state.Executions[0].RunID
	log := domain.ProcessLog{
		ProcessName: "process-logs", RunID: runID, Sequence: 1,
		Timestamp: time.Now().UTC(), Source: "stdout", Level: "info", Message: "hello from process",
	}
	running := base
	running.Processes[0].CurrentState = domain.ExecutionStateRunning
	running.Logs = []domain.ProcessLog{log}
	if _, err := service.SyncProcesses(t.Context(), running); err != nil {
		t.Fatalf("sync logs: %v", err)
	}
	if _, err := service.SyncProcesses(t.Context(), running); err != nil {
		t.Fatalf("retry logs: %v", err)
	}

	entries, err := repo.ListExecutionLogs(t.Context(), state.Executions[0].ID, 0, 100)
	if err != nil {
		t.Fatalf("list logs: %v", err)
	}
	if len(entries) != 1 || entries[0].Message != log.Message {
		t.Fatalf("logs = %#v, want one deduplicated entry", entries)
	}
}
