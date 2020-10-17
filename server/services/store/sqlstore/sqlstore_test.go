package sqlstore

import (
	"os"
	"testing"

	"github.com/stretchr/testify/require"
)

func SetupTests(t *testing.T) (*SQLStore, func()) {
	dbType := os.Getenv("OT_STORE_TEST_DB_TYPE")
	if dbType == "" {
		dbType = "sqlite3"
	}
	connectionString := os.Getenv("OT_STORE_TEST_CONN_STRING")
	if connectionString == "" {
		connectionString = ":memory:"
	}

	store, err := New(dbType, connectionString)
	require.Nil(t, err)

	tearDown := func() {
		store.Shutdown()
	}
	return store, tearDown
}
