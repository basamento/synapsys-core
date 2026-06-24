package domain

type StateSnapshot struct {
	Workers    []Worker
	Processes  []Process
	Executions []Execution
	Actions    []Action
}
