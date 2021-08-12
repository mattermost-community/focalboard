package sqlstore

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetMySQLMigrationConnection(t *testing.T) {
	testCases := []struct {
		Scenario    string
		DSN         string
		ExpectedDSN string
	}{
		{
			"Should append multiStatements param to the DSN path with existing params",
			"user:rand?&ompasswith@character@unix(/var/run/mysqld/mysqld.sock)/focalboard?writeTimeout=30s",
			"user:rand?&ompasswith@character@unix(/var/run/mysqld/mysqld.sock)/focalboard?writeTimeout=30s&multiStatements=true",
		},
		{
			"Should append multiStatements param to the DSN path with no existing params",
			"user:rand?&ompasswith@character@unix(/var/run/mysqld/mysqld.sock)/focalboard",
			"user:rand?&ompasswith@character@unix(/var/run/mysqld/mysqld.sock)/focalboard?multiStatements=true",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Scenario, func(t *testing.T) {
			res, err := appendMultipleStatementsFlag(tc.DSN)
			require.NoError(t, err)
			assert.Equal(t, tc.ExpectedDSN, res)
		})
	}
}
