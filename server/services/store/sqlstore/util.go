package sqlstore

import (
	"database/sql"
	"fmt"
	"os"
	"strings"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

func (s *SQLStore) CloseRows(rows *sql.Rows) {
	if err := rows.Close(); err != nil {
		s.logger.Error("error closing MattermostAuthLayer row set", mlog.Err(err))
	}
}

func (s *SQLStore) IsErrNotFound(err error) bool {
	return store.IsErrNotFound(err)
}

func PrepareNewTestDatabase() (dbType string, connectionString string, err error) {
	dbType = strings.TrimSpace(os.Getenv("FB_STORE_TEST_DB_TYPE"))
	if dbType == "" {
		dbType = model.SqliteDBType
	}

	var dbName string
	var rootUser string

	if dbType == model.SqliteDBType {
		connectionString = "file::memory:?cache=shared&_busy_timeout=5000"
	} else if port := strings.TrimSpace(os.Getenv("FB_STORE_TEST_DOCKER_PORT")); port != "" {
		// docker unit tests take priority over any DSN env vars
		var template string
		switch dbType {
		case model.MysqlDBType:
			template = "%s:mostest@tcp(localhost:%s)/%s?charset=utf8mb4,utf8&writeTimeout=30s"
			rootUser = "root"
		case model.PostgresDBType:
			template = "postgres://%s:mostest@localhost:%s/%s?sslmode=disable\u0026connect_timeout=10"
			rootUser = "mmuser"
		default:
			return "", "", newErrInvalidDBType(dbType)
		}

		connectionString = fmt.Sprintf(template, rootUser, port, "")

		// create a new database each run
		sqlDB, err := sql.Open(dbType, connectionString)
		if err != nil {
			return "", "", fmt.Errorf("cannot connect to %s database: %w", dbType, err)
		}
		defer sqlDB.Close()

		err = sqlDB.Ping()
		if err != nil {
			return "", "", fmt.Errorf("cannot ping %s database: %w", dbType, err)
		}

		dbName = "testdb_" + utils.NewID(utils.IDTypeNone)[:8]
		_, err = sqlDB.Exec(fmt.Sprintf("CREATE DATABASE %s;", dbName))
		if err != nil {
			return "", "", fmt.Errorf("cannot create %s database %s: %w", dbType, dbName, err)
		}

		if dbType != model.PostgresDBType {
			_, err = sqlDB.Exec(fmt.Sprintf("GRANT ALL PRIVILEGES ON %s.* TO mmuser;", dbName))
			if err != nil {
				return "", "", fmt.Errorf("cannot grant permissions on %s database %s: %w", dbType, dbName, err)
			}
		}

		connectionString = fmt.Sprintf(template, "mmuser", port, dbName)
	} else {
		// mysql or postgres need a DSN (connection string)
		connectionString = strings.TrimSpace(os.Getenv("FB_STORE_TEST_CONN_STRING"))
	}

	return dbType, connectionString, nil
}

type ErrInvalidDBType struct {
	dbType string
}

func newErrInvalidDBType(dbType string) error {
	return ErrInvalidDBType{
		dbType: dbType,
	}
}

func (e ErrInvalidDBType) Error() string {
	return "unsupported database type: " + e.dbType
}
