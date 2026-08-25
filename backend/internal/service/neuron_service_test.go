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

	registered, err := service.ListAllNeurons(t.Context())
	if err != nil {
		t.Fatalf("list processes after initial sync: %v", err)
	}
	if len(registered.Neurons) != 1 {
		t.Fatalf("registered processes = %d, want 1", len(registered.Neurons))
	}
	processID := registered.Neurons[0].ID

	updated, err := service.UpdateDesiredState(t.Context(), UpdateDesiredStateRequest{
		ProcessID:    processID,
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

	state, err := stateService.GetState(t.Context(), domain.StatePagination{
		Workers:    domain.CollectionPagination{Page: 1, PageSize: 10},
		Processes:  domain.CollectionPagination{Page: 1, PageSize: 10},
		Executions: domain.CollectionPagination{Page: 1, PageSize: 10},
		Actions:    domain.CollectionPagination{Page: 1, PageSize: 10},
	})
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
	if got := state.Pagination.Processes.TotalItems; got != 1 {
		t.Fatalf("state process total items = %d, want 1", got)
	}
}

func TestSameProcessNameOnDifferentWorkers(t *testing.T) {
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

	heartbeat := func(worker string) NeuronHeartbeatRequest {
		return NeuronHeartbeatRequest{
			WorkerName: worker,
			Framework:  domain.WorkerFrameworkSpringBoot,
			Host:       "localhost",
			PingTiming: 1000,
			Neurons: []NeuronHeartbeat{
				{
					Name:         "nightly-report",
					Type:         domain.ProcessTypeProgressive,
					CurrentState: domain.ExecutionStateIdle,
				},
			},
		}
	}

	if _, err := service.SyncNeurons(t.Context(), heartbeat("worker-a")); err != nil {
		t.Fatalf("sync worker-a: %v", err)
	}
	if _, err := service.SyncNeurons(t.Context(), heartbeat("worker-b")); err != nil {
		t.Fatalf("sync worker-b: %v", err)
	}

	list, err := service.ListAllNeurons(t.Context())
	if err != nil {
		t.Fatalf("list processes: %v", err)
	}
	// Both workers keep their own process: neither may steal the other's row.
	if len(list.Neurons) != 2 {
		t.Fatalf("listed processes = %d, want 2", len(list.Neurons))
	}

	owners := map[string]bool{}
	for _, process := range list.Neurons {
		if process.Name != "nightly-report" {
			t.Fatalf("process name = %q, want nightly-report", process.Name)
		}
		owners[process.WorkerName] = true
	}
	if !owners["worker-a"] || !owners["worker-b"] {
		t.Fatalf("process owners = %v, want both worker-a and worker-b", owners)
	}
}

func TestUpdateDesiredStateRejectsFailed(t *testing.T) {
	database, err := db.Open("file:" + filepath.ToSlash(filepath.Join(t.TempDir(), "nucleus.db")) + "?_foreign_keys=on")
	if err != nil {
		t.Fatalf("open database: %v", err)
	}
	defer database.Close()

	if err := db.RunMigrations(database); err != nil {
		t.Fatalf("run migrations: %v", err)
	}

	service := NewNeuronsService(sqlite.NewNeuronRepository(database))
	// "failed" is observed, never commanded.
	if _, err := service.UpdateDesiredState(t.Context(), UpdateDesiredStateRequest{
		ProcessID:    1,
		DesiredState: domain.ExecutionStateFailed,
	}); err == nil {
		t.Fatal("expected an error when commanding the failed state")
	}
}

func TestAckedCleanupLeavesSiblingRunIDIntact(t *testing.T) {
	database, err := db.Open("file:" + filepath.ToSlash(filepath.Join(t.TempDir(), "nucleus.db")) + "?_foreign_keys=on")
	if err != nil {
		t.Fatalf("open database: %v", err)
	}
	defer database.Close()

	if err := db.RunMigrations(database); err != nil {
		t.Fatalf("run migrations: %v", err)
	}

	service := NewNeuronsService(sqlite.NewNeuronRepository(database))

	// Two progressive processes on one worker, reported in a single heartbeat.
	heartbeat := func(alphaState domain.ExecutionState, alphaAck int64) NeuronHeartbeatRequest {
		return NeuronHeartbeatRequest{
			WorkerName: "worker-a",
			Framework:  domain.WorkerFrameworkSpringBoot,
			Host:       "localhost",
			PingTiming: 1000,
			Neurons: []NeuronHeartbeat{
				{Name: "alpha", Type: domain.ProcessTypeProgressive, CurrentState: alphaState, AckToken: alphaAck},
				{Name: "beta", Type: domain.ProcessTypeProgressive, CurrentState: domain.ExecutionStateIdle, AckToken: 0},
			},
		}
	}

	if _, err := service.SyncNeurons(t.Context(), heartbeat(domain.ExecutionStateIdle, 0)); err != nil {
		t.Fatalf("initial sync: %v", err)
	}

	registered, err := service.ListAllNeurons(t.Context())
	if err != nil {
		t.Fatalf("list processes: %v", err)
	}
	idByName := map[string]int64{}
	for _, process := range registered.Neurons {
		idByName[process.Name] = process.ID
	}

	for _, name := range []string{"alpha", "beta"} {
		updated, err := service.UpdateDesiredState(t.Context(), UpdateDesiredStateRequest{
			ProcessID:    idByName[name],
			DesiredState: domain.ExecutionStateRunning,
		})
		if err != nil {
			t.Fatalf("start %s: %v", name, err)
		}
		if !updated {
			t.Fatalf("expected %s to be commanded", name)
		}
	}

	pending, err := service.SyncNeurons(t.Context(), heartbeat(domain.ExecutionStateIdle, 0))
	if err != nil {
		t.Fatalf("pending sync: %v", err)
	}
	betaRunID := commandByName(t, pending, "beta").RunId
	if betaRunID == nil {
		t.Fatal("expected beta to receive a run id with its start command")
	}

	// alpha acks its start; beta's start is still in flight.
	acked, err := service.SyncNeurons(t.Context(), heartbeat(domain.ExecutionStateRunning, 1))
	if err != nil {
		t.Fatalf("acked sync: %v", err)
	}

	if got := commandByName(t, acked, "alpha").RunId; got != nil {
		t.Fatalf("alpha run id = %d, want nil after ack", *got)
	}

	beta := commandByName(t, acked, "beta")
	if beta.RunId == nil {
		t.Fatal("beta lost its run id when a sibling process acked its own command")
	}
	if *beta.RunId != *betaRunID {
		t.Fatalf("beta run id = %d, want %d", *beta.RunId, *betaRunID)
	}
	if beta.DesiredState != domain.ExecutionStateRunning {
		t.Fatalf("beta desired state = %q, want running", beta.DesiredState)
	}
}

func commandByName(t *testing.T, response NeuronHeartbeatResponse, name string) NeuronCommand {
	t.Helper()
	for _, command := range response.Neurons {
		if command.Name == name {
			return command
		}
	}
	t.Fatalf("no command returned for process %q", name)
	return NeuronCommand{}
}

func TestCompletedCommandResolvesActionWithoutDuplicateAck(t *testing.T) {
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

	heartbeat := func(state domain.ExecutionState, ack int64) NeuronHeartbeatRequest {
		return NeuronHeartbeatRequest{
			WorkerName: "worker-a",
			Framework:  domain.WorkerFrameworkSpringBoot,
			Host:       "localhost",
			PingTiming: 1000,
			Neurons: []NeuronHeartbeat{
				{Name: "tailer", Type: domain.ProcessTypeEndless, CurrentState: state, AckToken: ack},
			},
		}
	}

	if _, err := service.SyncNeurons(t.Context(), heartbeat(domain.ExecutionStateRunning, 0)); err != nil {
		t.Fatalf("initial sync: %v", err)
	}
	registered, err := service.ListAllNeurons(t.Context())
	if err != nil {
		t.Fatalf("list processes: %v", err)
	}

	if _, err := service.UpdateDesiredState(t.Context(), UpdateDesiredStateRequest{
		ProcessID:    registered.Neurons[0].ID,
		DesiredState: domain.ExecutionStateStopping,
	}); err != nil {
		t.Fatalf("stop command: %v", err)
	}

	// Worker acks and reports it has stopped, completing the command.
	if _, err := service.SyncNeurons(t.Context(), heartbeat(domain.ExecutionStateIdle, 1)); err != nil {
		t.Fatalf("ack sync: %v", err)
	}

	state, err := stateService.GetState(t.Context(), domain.StatePagination{
		Workers:    domain.CollectionPagination{Page: 1, PageSize: 10},
		Processes:  domain.CollectionPagination{Page: 1, PageSize: 10},
		Executions: domain.CollectionPagination{Page: 1, PageSize: 10},
		Actions:    domain.CollectionPagination{Page: 1, PageSize: 50},
	})
	if err != nil {
		t.Fatalf("get state: %v", err)
	}

	acks, waiting := 0, 0
	for _, action := range state.Actions {
		if action.Type == string(domain.ActionTypeAck) {
			acks++
		}
		if action.Status == string(domain.ActionStatusWaiting) {
			waiting++
		}
	}
	if acks != 1 {
		t.Fatalf("ack actions = %d, want exactly 1", acks)
	}
	if waiting != 0 {
		t.Fatalf("actions left waiting = %d, want 0 once the command completed", waiting)
	}
}
