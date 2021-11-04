// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package utils

import (
	"io"
	"sync"
)

// PairWriter provides a convenient way to write pairs of strings to an `io.Writer`, such as brackets,
// quotations, etc. For example, an opening '{' can be written, and a closing '}' can be conditionally
// written but only if the opening bracket was written.
// The open and close strings will only be written once, no matter how many times the APIs are called.
type PairWriter struct {
	mux sync.Mutex
	w   io.Writer

	opened bool
	closed bool
}

// NewPairWriter creates a new instance, which should not be copied.
func NewPairWriter(w io.Writer) *PairWriter {
	return &PairWriter{
		w: w,
	}
}

// WriteOpen writes a string, only once.
func (pw *PairWriter) WriteOpen(s string) (int, error) {
	pw.mux.Lock()
	defer pw.mux.Unlock()

	if !pw.opened {
		pw.opened = true
		return pw.w.Write([]byte(s))
	}
	return 0, nil
}

// WriteClose writes a string, only once.
func (pw *PairWriter) WriteClose(s string) (int, error) {
	pw.mux.Lock()
	defer pw.mux.Unlock()

	if !pw.closed {
		pw.closed = true
		return pw.w.Write([]byte(s))
	}
	return 0, nil
}

// WriteCloseIfOpened writes a string, only once, and only if `WriteOpen`
// was called at least once.
func (pw *PairWriter) WriteCloseIfOpened(s string) (int, error) {
	pw.mux.Lock()
	defer pw.mux.Unlock()

	if !pw.closed && pw.opened {
		pw.closed = true
		return pw.w.Write([]byte(s))
	}
	return 0, nil
}
