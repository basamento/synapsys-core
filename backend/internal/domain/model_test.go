package domain

import "testing"

func TestSdkWorkerFrameworksAreValidAndFilterable(t *testing.T) {
	frameworks := []WorkerFramework{
		WorkerFrameworkGo,
		WorkerFrameworkDotNet,
	}
	for _, framework := range frameworks {
		if !framework.Valid() {
			t.Fatalf("%s worker framework should be valid", framework)
		}

		if !CollectionSchemas[CollectionWorkers].Accepts(string(framework)) {
			t.Fatalf("workers framework filter should accept %s", framework)
		}
	}
}
