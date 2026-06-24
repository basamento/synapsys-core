package service

import (
	"path/filepath"
	"synapsys-core/internal/db"
	"synapsys-core/internal/domain"
	"synapsys-core/internal/repository/sqlite"
	"testing"
)

func TestProgressiveProcessCommandIdempotency(t *testing.T) {
	database, err := db.Open("file:" + filepath.ToSlash(filepath.Join(t.TempDir(), "nucleus.db")) + "?_foreign_keys=on")
	if err != nil {
		t.Fatalf("open database: %v", err)
	}
	defer database.Close()

	if err := db.RunMigrations(database); err != nil {
		t.Fatalf("run migrations: %v", err)
	}

	repo := sqlite.NewNeuronRepository(database)
	service := NewNeuronsService(repo)
	stateService := NewStateService(repo)
	req := NeuronHeartbeatRequest{
		WorkerName: "worker-a",
		Framework:  domain.WorkerFrameworkSpringBoot,
		Host:       "localhost",
		PingTiming: 1000,
		Neurons: []NeuronHeartbeat{
			{
				Name:         "process-a",
				Type:         domain.ProcessTypeProgressive,
				CurrentState: domain.ExecutionStateIdle,
				AckToken:     0,
			},
		},
	}

	initial, err := service.SyncNeurons(t.Context(), req)
	if err != nil {
		t.Fatalf("initial sync: %v", err)
	}
	if got := initial.Neurons[0].DesiredState; got != domain.ExecutionStateIdle {
		t.Fatalf("initial desired state = %q, want idle", got)
	}

	updated, err := service.UpdateDesiredState(t.Context(), UpdateDesiredStateRequest{
		NeuronName:   "process-a",
		DesiredState: domain.ExecutionStateRunning,
	})
	if err != nil {
		t.Fatalf("update desired state: %v", err)
	}
	if !updated {
		t.Fatal("expected process command to be updated")
	}

	pending, err := service.SyncNeurons(t.Context(), req)
	if err != nil {
		t.Fatalf("pending sync: %v", err)
	}
	if got := pending.Neurons[0].DesiredState; got != domain.ExecutionStateRunning {
		t.Fatalf("pending desired state = %q, want running", got)
	}
	if got := pending.Neurons[0].DesiredToken; got != 1 {
		t.Fatalf("pending desired token = %d, want 1", got)
	}
	if pending.Neurons[0].RunId == nil {
		t.Fatal("expected progressive start command to include a run id")
	}

	req.Neurons[0].CurrentState = domain.ExecutionStateRunning
	req.Neurons[0].AckToken = pending.Neurons[0].DesiredToken
	acked, err := service.SyncNeurons(t.Context(), req)
	if err != nil {
		t.Fatalf("acked sync: %v", err)
	}
	if got := acked.Neurons[0].DesiredState; got != domain.ExecutionStateIdle {
		t.Fatalf("acked desired state = %q, want idle", got)
	}
	if acked.Neurons[0].RunId != nil {
		t.Fatal("expected run id to be cleared after ack")
	}

	list, err := service.ListAllNeurons(t.Context())
	if err != nil {
		t.Fatalf("list processes: %v", err)
	}
	if len(list.Neurons) != 1 {
		t.Fatalf("listed processes = %d, want 1", len(list.Neurons))
	}
	if got := list.Neurons[0].WorkerName; got != "worker-a" {
		t.Fatalf("worker name = %q, want worker-a", got)
	}

	state, err := stateService.GetState(t.Context())
	if err != nil {
		t.Fatalf("get state: %v", err)
	}
	if len(state.Workers) != 1 {
		t.Fatalf("state workers = %d, want 1", len(state.Workers))
	}
	if len(state.Processes) != 1 {
		t.Fatalf("state processes = %d, want 1", len(state.Processes))
	}
	if len(state.Executions) != 1 {
		t.Fatalf("state executions = %d, want 1", len(state.Executions))
	}
	if len(state.Actions) == 0 {
		t.Fatal("expected state actions to include command history")
	}
}
