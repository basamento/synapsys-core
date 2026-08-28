package handler

import (
	"encoding/json"
	"strings"
	"synapsys-core/internal/domain"
	"synapsys-core/internal/service"
	"testing"
)

func TestToSyncServiceRequestAcceptsWorkerHeartbeatBody(t *testing.T) {
	ackToken := int64(12)
	dto := heartbeatRequestDTO{
		WorkerName:        "my-worker-app",
		HeartbeatInterval: 5,
		Processes: []processInfoDTO{
			{
				Name:         "endless process 1",
				Type:         "endless",
				CurrentState: "running",
				DesiredState: "running",
				DesiredToken: &ackToken,
				AckToken:     &ackToken,
			},
		},
	}

	req, err := toSyncServiceRequest(dto, "127.0.0.1:8080")
	if err != nil {
		t.Fatalf("toSyncServiceRequest returned error: %v", err)
	}

	if req.WorkerName != "my-worker-app" {
		t.Fatalf("worker name = %q, want my-worker-app", req.WorkerName)
	}
	// A worker that does not declare its framework must not be assumed to be Java.
	if req.Framework != domain.WorkerFrameworkUnknown {
		t.Fatalf("framework = %q, want unknown", req.Framework)
	}
	if req.Host != "127.0.0.1" {
		t.Fatalf("host = %q, want 127.0.0.1", req.Host)
	}
	if req.PingTiming != 5 {
		t.Fatalf("ping timing = %d, want 5", req.PingTiming)
	}
	if len(req.Processes) != 1 {
		t.Fatalf("processes = %d, want 1", len(req.Processes))
	}
	if req.Processes[0].AckToken != 12 {
		t.Fatalf("ack token = %d, want 12", req.Processes[0].AckToken)
	}
}

func TestHeartbeatProcessesResponseUsesProcessesField(t *testing.T) {
	ackToken := int64(12)
	runID := int64(99)
	response := service.HeartbeatResponse{
		Processes: []service.ProcessCommand{
			{
				Name:         "endless process 1",
				Type:         domain.ProcessTypeEndless,
				DesiredState: domain.ExecutionStateRunning,
				DesiredToken: 13,
				RunId:        &runID,
			},
		},
	}
	request := heartbeatRequestDTO{
		Processes: []processInfoDTO{
			{
				Name:         "endless process 1",
				Type:         "endless",
				CurrentState: "running",
				AckToken:     &ackToken,
			},
		},
	}

	body := toHeartbeatProcessesResponse(response, request)
	raw, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("marshal response: %v", err)
	}
	jsonBody := string(raw)

	if !strings.Contains(jsonBody, `"processes"`) {
		t.Fatalf("response body = %s, want processes field", jsonBody)
	}
	if strings.Contains(jsonBody, `"neurons"`) {
		t.Fatalf("response body = %s, must not contain the legacy neurons field", jsonBody)
	}
	if !strings.Contains(jsonBody, `"desiredToken":13`) {
		t.Fatalf("response body = %s, want desired token", jsonBody)
	}
}

func TestToSyncServiceRequestSkipsUnreadableProcesses(t *testing.T) {
	dto := heartbeatRequestDTO{
		WorkerName:        "my-worker-app",
		HeartbeatInterval: 5,
		Processes: []processInfoDTO{
			{Name: "bad", Type: "endless", CurrentState: "teleporting"},
			{Name: "good", Type: "endless", CurrentState: "running"},
		},
	}

	req, err := toSyncServiceRequest(dto, "127.0.0.1:8080")
	if err != nil {
		t.Fatalf("toSyncServiceRequest returned error: %v", err)
	}
	// One unreadable process must not cost us visibility of the whole worker.
	if len(req.Processes) != 1 {
		t.Fatalf("processes = %d, want 1", len(req.Processes))
	}
	if req.Processes[0].Name != "good" {
		t.Fatalf("kept process = %q, want good", req.Processes[0].Name)
	}
}

func TestToSyncServiceRequestAcceptsFailedState(t *testing.T) {
	dto := heartbeatRequestDTO{
		WorkerName:        "my-worker-app",
		Framework:         "nodejs",
		Host:              "worker-host",
		HeartbeatInterval: 5,
		Processes: []processInfoDTO{
			{Name: "crashed", Type: "progressive", CurrentState: "FAILED"},
		},
	}

	req, err := toSyncServiceRequest(dto, "127.0.0.1:8080")
	if err != nil {
		t.Fatalf("toSyncServiceRequest returned error: %v", err)
	}
	if len(req.Processes) != 1 {
		t.Fatalf("processes = %d, want 1", len(req.Processes))
	}
	if got := req.Processes[0].CurrentState; got != domain.ExecutionStateFailed {
		t.Fatalf("current state = %q, want failed", got)
	}
	if req.Framework != domain.WorkerFrameworkNodeJS {
		t.Fatalf("framework = %q, want nodejs", req.Framework)
	}
	if req.Host != "worker-host" {
		t.Fatalf("host = %q, want worker-host", req.Host)
	}
}

func TestToSyncServiceRequestFailsWhenNothingReadable(t *testing.T) {
	dto := heartbeatRequestDTO{
		WorkerName: "my-worker-app",
		Processes: []processInfoDTO{
			{Name: "bad", Type: "quantum", CurrentState: "teleporting"},
		},
	}

	if _, err := toSyncServiceRequest(dto, "127.0.0.1:8080"); err == nil {
		t.Fatal("expected an error when no process in the batch is readable")
	}
}

func TestToSyncServiceRequestSkipsProcessWithoutName(t *testing.T) {
	dto := heartbeatRequestDTO{
		WorkerName:        "my-worker-app",
		HeartbeatInterval: 5,
		Processes: []processInfoDTO{
			{Name: "", Type: "endless", CurrentState: "running"},
			{Name: "good", Type: "endless", CurrentState: "idle"},
		},
	}

	req, err := toSyncServiceRequest(dto, "127.0.0.1:8080")
	if err != nil {
		t.Fatalf("toSyncServiceRequest returned error: %v", err)
	}
	if len(req.Processes) != 1 || req.Processes[0].Name != "good" {
		t.Fatalf("processes = %#v, want only good", req.Processes)
	}
}

func TestToSyncServiceRequestRequiresPositiveHeartbeatInterval(t *testing.T) {
	dto := heartbeatRequestDTO{
		WorkerName: "my-worker-app",
		Processes: []processInfoDTO{
			{Name: "good", Type: "endless", CurrentState: "idle"},
		},
	}

	if _, err := toSyncServiceRequest(dto, "127.0.0.1:8080"); err == nil {
		t.Fatal("expected heartbeatInterval validation error")
	}
}

// The legacy aliases applicationName, pingTiming and neurons were removed once
// the only client sent canonical names. A body carrying just the old spellings
// now decodes to nothing, and must be rejected rather than silently accepted
// as a worker with no name and no processes.
func TestLegacyAliasesAreNoLongerAccepted(t *testing.T) {
	body := `{
		"applicationName": "my-worker-app",
		"pingTiming": 5,
		"neurons": [
			{"name": "p1", "type": "endless", "currentState": "running", "ackToken": 3}
		]
	}`

	var dto heartbeatRequestDTO
	if err := json.Unmarshal([]byte(body), &dto); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	if dto.WorkerName != "" {
		t.Fatalf("worker name = %q, want empty: applicationName must not bind", dto.WorkerName)
	}
	if dto.HeartbeatInterval != 0 {
		t.Fatalf("heartbeat interval = %d, want 0: pingTiming must not bind", dto.HeartbeatInterval)
	}
	if len(dto.Processes) != 0 {
		t.Fatalf("processes = %d, want 0: the legacy neurons field must not bind", len(dto.Processes))
	}

	if _, err := toSyncServiceRequest(dto, "127.0.0.1:8080"); err == nil {
		t.Fatal("toSyncServiceRequest accepted a body containing only legacy aliases")
	}
}

// A heartbeat carries process commands as well as console output. One unreadable
// log entry must cost only that entry: rejecting the beat would drop every command
// on it, and the client requeues and resends the same entry forever.
func TestToSyncServiceRequestSkipsUnreadableLogsAndKeepsTheBatch(t *testing.T) {
	runID := int64(7)
	sequence := int64(1)
	nextSequence := int64(2)
	zeroRunID := int64(0)
	timestamp := "2026-08-28T10:00:00.123456789Z"

	dto := heartbeatRequestDTO{
		WorkerName:        "my-worker-app",
		HeartbeatInterval: 5,
		Processes: []processInfoDTO{
			{Name: "chatty", Type: "endless", CurrentState: "running", AckToken: &sequence},
		},
		Logs: []processLogDTO{
			{ProcessName: "chatty", RunID: &runID, Sequence: &sequence, Timestamp: timestamp,
				Source: "stdout", Level: "info", Message: "kept"},
			// Whitespace only: exactly what a client printing a blank line produces.
			{ProcessName: "chatty", RunID: &runID, Sequence: &nextSequence, Timestamp: timestamp,
				Source: "stdout", Level: "info", Message: "   "},
			{ProcessName: "chatty", RunID: &zeroRunID, Sequence: &nextSequence, Timestamp: timestamp,
				Source: "stdout", Level: "info", Message: "no run"},
			{ProcessName: "chatty", RunID: &runID, Sequence: &nextSequence, Timestamp: "not-a-timestamp",
				Source: "stdout", Level: "info", Message: "bad timestamp"},
			{ProcessName: "chatty", RunID: &runID, Sequence: &nextSequence, Timestamp: timestamp,
				Source: "telepathy", Level: "info", Message: "bad source"},
			{ProcessName: "chatty", RunID: &runID, Sequence: &nextSequence, Timestamp: timestamp,
				Source: "stdout", Level: "shouting", Message: "bad level"},
			{ProcessName: "chatty", RunID: &runID, Sequence: &nextSequence, Timestamp: timestamp,
				Source: "stdout", Level: "info", Message: "also kept"},
		},
	}

	req, err := toSyncServiceRequest(dto, "127.0.0.1:8080")
	if err != nil {
		t.Fatalf("toSyncServiceRequest returned error: %v", err)
	}
	// The process, and therefore the command Core answers with, survives the bad entry.
	if len(req.Processes) != 1 || req.Processes[0].Name != "chatty" {
		t.Fatalf("processes = %#v, want the reported process kept", req.Processes)
	}
	if req.Processes[0].AckToken != 1 {
		t.Fatalf("ack token = %d, want 1", req.Processes[0].AckToken)
	}
	if len(req.Logs) != 2 {
		t.Fatalf("logs = %d, want the 2 readable entries", len(req.Logs))
	}
	if req.Logs[0].Message != "kept" || req.Logs[1].Message != "also kept" {
		t.Fatalf("logs = %#v, want the readable entries, in order", req.Logs)
	}
}
