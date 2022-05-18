package sqlstore

import (
	"database/sql"
	"fmt"
	"strconv"
	"strings"
	"time"

	sq "github.com/Masterminds/squirrel"

	"github.com/mattermost/mattermost-plugin-api/cluster"

	utils "github.com/mattermost/focalboard/server/utils"
	mmModel "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	mysqlDBType    = "mysql"
	sqliteDBType   = "sqlite3"
	postgresDBType = "postgres"
)

// SQLStore is a SQL database.
type SQLStore struct {
	db               *sql.DB
	dbType           string
	tablePrefix      string
	connectionString string
	isPlugin         bool
	logger           *mlog.Logger
	NewMutexFn       MutexFactory
}

// MutexFactory is used by the store in plugin mode to generate
// a cluster mutex.
type MutexFactory func(name string) (*cluster.Mutex, error)

// New creates a new SQL implementation of the store.
func New(params Params) (*SQLStore, error) {
	if err := params.CheckValid(); err != nil {
		return nil, err
	}

	params.Logger.Info("connectDatabase", mlog.String("dbType", params.DBType))
	store := &SQLStore{
		// TODO: add replica DB support too.
		db:               params.DB,
		dbType:           params.DBType,
		tablePrefix:      params.TablePrefix,
		connectionString: params.ConnectionString,
		logger:           params.Logger,
		isPlugin:         params.IsPlugin,
		NewMutexFn:       params.NewMutexFn,
	}

	err := store.Migrate()
	if err != nil {
		params.Logger.Error(`Table creation / migration failed`, mlog.Err(err))

		return nil, err
	}
	return store, nil
}

// Shutdown close the connection with the store.
func (s *SQLStore) Shutdown() error {
	return s.db.Close()
}

// DBHandle returns the raw sql.DB handle.
// It is used by the mattermostauthlayer to run their own
// raw SQL queries.
func (s *SQLStore) DBHandle() *sql.DB {
	return s.db
}

// DBType returns the DB driver used for the store.
func (s *SQLStore) DBType() string {
	return s.dbType
}

func (s *SQLStore) getQueryBuilder(db sq.BaseRunner) sq.StatementBuilderType {
	builder := sq.StatementBuilder
	if s.dbType == postgresDBType || s.dbType == sqliteDBType {
		builder = builder.PlaceholderFormat(sq.Dollar)
	}

	return builder.RunWith(db)
}

func (s *SQLStore) escapeField(fieldName string) string { //nolint:unparam
	if s.dbType == mysqlDBType {
		return "`" + fieldName + "`"
	}
	if s.dbType == postgresDBType || s.dbType == sqliteDBType {
		return "\"" + fieldName + "\""
	}
	return fieldName
}

func (s *SQLStore) getLicense(db sq.BaseRunner) *mmModel.License {
	return nil
}

func (s *SQLStore) durationSelector(interval string) int64 {
	intervalMagnitudeString := strings.Fields(interval)[0]
	intervalMagnitude, err := strconv.Atoi(intervalMagnitudeString)
	if err != nil {
		// handle error: buggy, change function to introduce err
		return utils.GetMillisForTime(time.Now())
	}
	if strings.Contains(interval, "day") {
		return utils.GetMillisForTime(time.Now().AddDate(0, 0, -1*intervalMagnitude))
	}
	if strings.Contains(interval, "month") {
		return utils.GetMillisForTime(time.Now().AddDate(0, -1*intervalMagnitude, 0))
	}
	if strings.Contains(interval, "year") {
		return utils.GetMillisForTime(time.Now().AddDate(-1*intervalMagnitude, 0, 0))
	}
	return utils.GetMillisForTime(time.Now())
}

func (s *SQLStore) concatenationSelector(field string, delimiter string) string {
	if s.dbType == sqliteDBType {
		return fmt.Sprintf("group_concat(%s)", field)
	}
	if s.dbType == postgresDBType {
		return fmt.Sprintf("string_agg(%s, '%s')", field, delimiter)
	}
	if s.dbType == mysqlDBType {
		return fmt.Sprintf("GROUP_CONCAT(%s SEPARATOR '%s')", field, delimiter)
	}
	return ""
}

func (s *SQLStore) elementInColumn(parameterCount int, column string) string {
	if s.dbType == sqliteDBType || s.dbType == mysqlDBType {
		return fmt.Sprintf("instr(%s, %s) > 0", column, s.parameterPlaceholder(parameterCount))
	}
	if s.dbType == postgresDBType {
		return fmt.Sprintf("position(%s in %s) > 0", s.parameterPlaceholder(parameterCount), column)
	}
	return ""
}

func (s *SQLStore) parameterPlaceholder(count int) string {
	if s.dbType == postgresDBType || s.dbType == sqliteDBType {
		return fmt.Sprintf("$%v", count)
	}
	if s.dbType == mysqlDBType {
		return "?"
	}
	return ""
}
