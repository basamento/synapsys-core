package sqlite

import (
	"context"
	"fmt"
	"path/filepath"
	"sync"
	"testing"
	"time"

	"synapsys-core/internal/db"
	"synapsys-core/internal/domain"
)

func TestConcurrentHeartbeatsAndStateReads(t *testing.T) {
	database, err := db.Open("file:" + filepath.ToSlash(filepath.Join(t.TempDir(), "concurrency.db")))
	if err != nil {
		t.Fatalf("open database: %v", err)
	}
	t.Cleanup(func() { _ = database.Close() })
	if err := db.RunMigrations(database); err != nil {
		t.Fatalf("run migrations: %v", err)
	}

	repository := NewProcessRepository(database)
	ctx, cancel := context.WithTimeout(t.Context(), 20*time.Second)
	defer cancel()
	start := make(chan struct{})
	errorsFound := make(chan error, 300)
	var workers sync.WaitGroup

	for workerIndex := range 4 {
		workers.Add(1)
		go func() {
			defer workers.Done()
			<-start
			for range 50 {
				now := time.Now()
				name := fmt.Sprintf("worker-%d", workerIndex)
				_, err := repository.SyncHeartbeat(ctx, domain.Worker{
					Name:            name,
					FirstConnection: now,
					LastConnection:  now,
					Framework:       domain.WorkerFrameworkGo,
					Host:            "localhost",
					LastTouch:       now,
				}, []domain.ProcessObservation{{
					Name:          "process",
					Type:          domain.ProcessTypeProgressive,
					CurrentStatus: domain.ExecutionStateIdle,
					PingTiming:    5,
				}})
				if err != nil {
					errorsFound <- fmt.Errorf("heartbeat %s: %w", name, err)
					return
				}
			}
		}()
	}

	workers.Add(1)
	go func() {
		defer workers.Done()
		<-start
		pagination := domain.CollectionPagination{Page: 1, PageSize: 10}
		for range 100 {
			if _, err := repository.ListState(ctx, domain.StatePagination{
				Workers: pagination, Processes: pagination, Executions: pagination, Actions: pagination,
			}); err != nil {
				errorsFound <- fmt.Errorf("list state: %w", err)
				return
			}
		}
	}()

	close(start)
	workers.Wait()
	close(errorsFound)
	for err := range errorsFound {
		t.Error(err)
	}
}
