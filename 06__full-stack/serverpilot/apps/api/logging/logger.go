// Package logging provides structured JSON logging for the ServerPilot API.
package logging

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"sync"
	"time"
)

// Level represents log severity.
type Level string

const (
	LevelDebug Level = "DEBUG"
	LevelInfo  Level = "INFO"
	LevelWarn  Level = "WARN"
	LevelError Level = "ERROR"
)

// Logger is a structured JSON logger with configurable output and minimum level.
type Logger struct {
	mu      sync.Mutex
	out     io.Writer
	level   Level
	service string
}

// Entry is a single structured log record.
type Entry struct {
	Timestamp string         `json:"timestamp"`
	Level     Level          `json:"level"`
	Service   string         `json:"service"`
	Message   string         `json:"message"`
	RequestID string         `json:"request_id,omitempty"`
	Method    string         `json:"method,omitempty"`
	Path      string         `json:"path,omitempty"`
	Status    int            `json:"status,omitempty"`
	Latency   string         `json:"latency,omitempty"`
	Bytes     int64          `json:"bytes,omitempty"`
	Remote    string         `json:"remote,omitempty"`
	Error     string         `json:"error,omitempty"`
	Fields    map[string]any `json:"fields,omitempty"`
}

// New creates a Logger writing JSON lines to stdout.
func New(service string) *Logger {
	return &Logger{
		out:     os.Stdout,
		level:   LevelInfo,
		service: service,
	}
}

// SetLevel sets the minimum log level.
func (l *Logger) SetLevel(level Level) {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.level = level
}

// SetOutput redirects log output (useful for tests).
func (l *Logger) SetOutput(w io.Writer) {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.out = w
}

func (l *Logger) shouldLog(level Level) bool {
	order := map[Level]int{LevelDebug: 0, LevelInfo: 1, LevelWarn: 2, LevelError: 3}
	return order[level] >= order[l.level]
}

func (l *Logger) write(level Level, message string, fields map[string]any) {
	if !l.shouldLog(level) {
		return
	}

	entry := Entry{
		Timestamp: time.Now().UTC().Format(time.RFC3339Nano),
		Level:     level,
		Service:   l.service,
		Message:   message,
		Fields:    fields,
	}

	if fields != nil {
		if v, ok := fields["request_id"].(string); ok {
			entry.RequestID = v
		}
		if v, ok := fields["method"].(string); ok {
			entry.Method = v
		}
		if v, ok := fields["path"].(string); ok {
			entry.Path = v
		}
		if v, ok := fields["status"].(int); ok {
			entry.Status = v
		}
		if v, ok := fields["latency"].(string); ok {
			entry.Latency = v
		}
		if v, ok := fields["bytes"].(int64); ok {
			entry.Bytes = v
		}
		if v, ok := fields["remote"].(string); ok {
			entry.Remote = v
		}
		if v, ok := fields["error"].(string); ok {
			entry.Error = v
		}
	}

	l.mu.Lock()
	defer l.mu.Unlock()

	data, err := json.Marshal(entry)
	if err != nil {
		log.Printf("logger marshal error: %v", err)
		return
	}
	fmt.Fprintln(l.out, string(data))
}

// Debug logs a debug-level message.
func (l *Logger) Debug(message string, fields map[string]any) {
	l.write(LevelDebug, message, fields)
}

// Info logs an info-level message.
func (l *Logger) Info(message string, fields map[string]any) {
	l.write(LevelInfo, message, fields)
}

// Warn logs a warning-level message.
func (l *Logger) Warn(message string, fields map[string]any) {
	l.write(LevelWarn, message, fields)
}

// Error logs an error-level message.
func (l *Logger) Error(message string, fields map[string]any) {
	l.write(LevelError, message, fields)
}

// Request logs an HTTP request with standard access-log fields.
func (l *Logger) Request(reqID, method, path string, status int, latency time.Duration, bytes int64, remote string) {
	l.write(LevelInfo, "request completed", map[string]any{
		"request_id": reqID,
		"method":     method,
		"path":       path,
		"status":     status,
		"latency":    latency.String(),
		"bytes":      bytes,
		"remote":     remote,
	})
}
