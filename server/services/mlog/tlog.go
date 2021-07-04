package mlog

import (
	"sync"
	"testing"

	"github.com/mattermost/logr/v2"
	"github.com/mattermost/logr/v2/formatters"
)

// CreateTestLogger creates a logger for unit tests. Log records are output to `(*testing.T)Log`.
func CreateTestLogger(t *testing.T, levels ...Field) (logger *Logger) {
	logger = NewLogger()

	filter := logr.NewCustomFilter(StdAll...)
	formatter := &formatters.Plain{}
	target := newTestingTarget(t)

	if err := logger.log.Logr().AddTarget(target, "test", filter, formatter, 1000); err != nil {
		t.Fail()
		return nil
	}
	return logger
}

// testingTarget is a simple log target that writes to the testing log.
type testingTarget struct {
	mux sync.Mutex
	t   *testing.T
}

func newTestingTarget(t *testing.T) *testingTarget {
	return &testingTarget{
		t: t,
	}
}

// Init is called once to initialize the target.
func (tt *testingTarget) Init() error {
	return nil
}

// Write outputs bytes to this file target.
func (tt *testingTarget) Write(p []byte, rec *logr.LogRec) (int, error) {
	tt.mux.Lock()
	defer tt.mux.Unlock()

	if tt.t != nil {
		tt.t.Log(string(p))
	}
	return len(p), nil
}

// Shutdown is called once to free/close any resources.
// Target queue is already drained when this is called.
func (tt *testingTarget) Shutdown() error {
	tt.mux.Lock()
	defer tt.mux.Unlock()

	tt.t = nil
	return nil
}
