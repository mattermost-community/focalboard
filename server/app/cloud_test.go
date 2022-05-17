package app

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestIsCloudLimited(t *testing.T) {
	t.Run("if it's not running on plugin mode", func(t *testing.T) {
		th, tearDown := SetupTestHelper(t)
		defer tearDown()
	})

	t.Run("if it's running on plugin mode, with a non-cloud license", func(t *testing.T) {
		th, tearDown := SetupTestHelper(t)
		defer tearDown()
	})

	t.Run("if it's running on plugin mode with a cloud license", func(t *testing.T) {
		th, tearDown := SetupTestHelper(t)
		defer tearDown()
	})
}

func TestIsCloudLimited(t *testing.T) {
	t.Run("if no limit has been set, it should be false", func(t *testing.T) {
		th, tearDown := SetupTestHelper(t)
		defer tearDown()
	})

	t.Run("if the limit is set, it should be true", func(t *testing.T) {
		th, tearDown := SetupTestHelper(t)
		defer tearDown()
	})
}

func TestSetCloudLimits(t *testing.T) {
	t.Run("if the limits are empty, it should do nothing", func(t *testing.T) {
		t.Run("limits empty", func(t *testing.T) {

		})
		t.Run("limits not empty but board limits empty", func(t *testing.T) {

		})
	})
	t.Run("if the limits are not empty, it should update them and calculate the new timestamp", func(t *testing.T) { })
}

func TestUpdateCardLimitTimestampSkipCluster(t *testing.T) {
	t.Run("if the server is not cloud limited, it should do nothing", func(t *testing.T) { })
	t.Run("if the server is cloud limited and the timestamp changes, it should update it and send a WS message", func(t *testing.T) { })
	t.Run("if the server is cloud limited and the timestamp doesn't change, it should not send the WS message", func(t *testing.T) { })
}

func TestUpdateCardLimitTimestampSkipCluster(t *testing.T) {
	t.Run("if the server is not cloud limited, it should do nothing", func(t *testing.T) { })
	t.Run("if the timestamp changes, it should update it, send a WS message and propagate to the cluster", func(t *testing.T) { })
	t.Run("if the timestamp changes and the plugin is not present, it should error", func(t *testing.T) { })
}
