// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package utils

import (
	"bytes"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	filler = "...."
)

func TestPairWriter_WriteOpen(t *testing.T) {
	tests := []struct {
		name   string
		opener string
		closer string
		want   string
	}{
		{name: "comments", opener: "/**", closer: "*/", want: "/**" + filler + "*/"},
		{name: "quote", opener: "'", closer: "'", want: "'" + filler + "'"},
		{name: "markdown", opener: "```", closer: "```", want: "```" + filler + "```"},
		{name: "empty", opener: "", closer: "", want: filler},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			buf := &bytes.Buffer{}
			pw := NewPairWriter(buf, tt.opener, tt.closer)

			// conditional closer before opener should be noop
			n, err := pw.WriteCloseIfOpened()
			assert.Zero(t, n)
			assert.NoError(t, err)

			for i := 0; i < 5; i++ {
				_, err = pw.WriteOpen()
				require.NoError(t, err)
			}

			_, err = buf.WriteString(filler)
			assert.NoError(t, err)

			for i := 0; i < 5; i++ {
				_, err = pw.WriteCloseIfOpened()
				require.NoError(t, err)
			}

			// opener again after close should be noop
			n, err = pw.WriteOpen()
			assert.Zero(t, n)
			assert.NoError(t, err)

			got := buf.String()

			assert.Equal(t, tt.want, got)
		})
	}
}
