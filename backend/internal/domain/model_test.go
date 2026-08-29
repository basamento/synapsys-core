package domain

import "testing"

func TestGoWorkerFrameworkIsValid(t *testing.T) {
	if !WorkerFrameworkGo.Valid() {
		t.Fatal("go worker framework should be valid")
	}

	if !CollectionSchemas[CollectionWorkers].Accepts(string(WorkerFrameworkGo)) {
		t.Fatal("workers framework filter should accept go")
	}
}
