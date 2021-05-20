// Package mlog provides a simple wrapper around Logr.
package mlog

import (
	"encoding/json"
	"fmt"

	"github.com/mattermost/logr/v2"
	logrcfg "github.com/mattermost/logr/v2/config"
)

// Type and function aliases from Logr to limit the spread of dependencies throughout Focalboard.
type Field = logr.Field
type Level = logr.Level

// Any picks the best supported field type based on type of val.
// For best performance when passing a struct (or struct pointer),
// implement `logr.LogWriter` on the struct, otherwise reflection
// will be used to generate a string representation.
var Any = logr.Any

// Int64 constructs a field containing a key and Int64 value.
var Int64 = logr.Int64

// Int32 constructs a field containing a key and Int32 value.
var Int32 = logr.Int32

// Int constructs a field containing a key and Int value.
var Int = logr.Int

// Uint64 constructs a field containing a key and Uint64 value.
var Uint64 = logr.Uint64

// Uint32 constructs a field containing a key and Uint32 value.
var Uint32 = logr.Uint32

// Uint constructs a field containing a key and Uint value.
var Uint = logr.Uint

// Float64 constructs a field containing a key and Float64 value.
var Float64 = logr.Float64

// Float32 constructs a field containing a key and Float32 value.
var Float32 = logr.Float32

// String constructs a field containing a key and String value.
var String = logr.String

// Err constructs a field containing a default key ("error") and error value.
var Err = logr.Err

// NamedErr constructs a field containing a key and error value.
var NamedErr = logr.NamedErr

// Bool constructs a field containing a key and bool value.
var Bool = logr.Bool

// Time constructs a field containing a key and time.Time value.
var Time = logr.Time

// Duration constructs a field containing a key and time.Duration value.
var Duration = logr.Duration

// Millis constructs a field containing a key and timestamp value.
// The timestamp is expected to be milliseconds since Jan 1, 1970 UTC.
var Millis = logr.Millis

// Array constructs a field containing a key and array value.
var Array = logr.Array

// Map constructs a field containing a key and map value.
var Map = logr.Map

// Logger provides a thin wrapper around a Logr instance. This is a struct instead of an interface
// so that there are no allocations on the heap each interface method invocation. Normally not
// something to be concerned about, but logging calls for disabled levels should have as little CPU
// and memory impact as possible. Most of these wrapper calls will be inlined as well.
type Logger struct {
	log *logr.Logger
}

// NewLogger creates a new Logger instance which can be configured via `(*Logger).Configure`
func NewLogger() *Logger {
	lgr, _ := logr.New()
	log := lgr.NewLogger()

	return &Logger{
		log: &log,
	}
}

// Configure provides a new configuration for this logger,
func (l *Logger) Configure(cfg json.RawMessage) error {
	if len(cfg) == 0 {
		return nil
	}

	var cfgMap map[string]logrcfg.TargetCfg

	err := json.Unmarshal(cfg, &cfgMap)
	if err != nil {
		return fmt.Errorf("invalid logger config: %w", err)
	}

	return logrcfg.ConfigureTargets(l.log.Logr(), cfgMap, nil)
}

// IsLevelEnabled returns true only if at least one log target is
// configured to emit the specified log level. Use this check when
// gathering the log info may be expensive.
//
// Note, transformations and serializations done via fields are already
// lazily evaluated and don't require this check beforehand.
func (l *Logger) IsLevelEnabled(level Level) bool {
	return l.IsLevelEnabled(level)
}

// Log emits the log record for any targets configured for the specified
// level.
func (l *Logger) Log(level Level, msg string, fields ...Field) {
	l.log.Log(level, msg, fields...)
}

func (l *Logger) LogM(levels []Level, msg string, fields ...Field) {
	l.log.LogM(levels, msg, fields...)
}

func (l *Logger) Debug(msg string, fields ...Field) {
	l.log.Debug(msg, fields...)
}

func (l *Logger) Info(msg string, fields ...Field) {
	l.log.Info(msg, fields...)
}

func (l *Logger) Warn(msg string, fields ...Field) {
	l.log.Warn(msg, fields...)
}

func (l *Logger) Error(msg string, fields ...Field) {
	l.log.Error(msg, fields...)
}
