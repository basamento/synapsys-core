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
	dto := neuronHeartbeatRequestDTO{
		WorkerName:        "my-worker-app",
		HeartbeatInterval: 5000,
		Processes: []neuronInfoDTO{
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
	if req.Framework != domain.WorkerFrameworkSpringBoot {
		t.Fatalf("framework = %q, want springboot", req.Framework)
	}
	if req.Host != "127.0.0.1" {
		t.Fatalf("host = %q, want 127.0.0.1", req.Host)
	}
	if req.PingTiming != 5000 {
		t.Fatalf("ping timing = %d, want 5000", req.PingTiming)
	}
	if len(req.Neurons) != 1 {
		t.Fatalf("processes = %d, want 1", len(req.Neurons))
	}
	if req.Neurons[0].AckToken != 12 {
		t.Fatalf("ack token = %d, want 12", req.Neurons[0].AckToken)
	}
}

func TestHeartbeatProcessesResponseUsesProcessesField(t *testing.T) {
	ackToken := int64(12)
	runID := int64(99)
	response := service.NeuronHeartbeatResponse{
		Neurons: []service.NeuronCommand{
			{
				Name:         "endless process 1",
				Type:         domain.ProcessTypeEndless,
				DesiredState: domain.ExecutionStateRunning,
				DesiredToken: 13,
				RunId:        &runID,
			},
		},
	}
	request := neuronHeartbeatRequestDTO{
		Processes: []neuronInfoDTO{
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
		t.Fatalf("response body = %s, must not contain neurons field", jsonBody)
	}
	if !strings.Contains(jsonBody, `"desiredToken":13`) {
		t.Fatalf("response body = %s, want desired token", jsonBody)
	}
}
