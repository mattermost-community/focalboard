package sqlstore

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"text/template"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database"
	"github.com/golang-migrate/migrate/v4/database/mysql"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/database/sqlite3"
	"github.com/golang-migrate/migrate/v4/source"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	bindata "github.com/golang-migrate/migrate/v4/source/go_bindata"
	_ "github.com/lib/pq"
	"github.com/mattermost/focalboard/server/services/store/sqlstore/migrations"
)

type PrefixedMigration struct {
	*bindata.Bindata
	prefix   string
	postgres bool
	sqlite   bool
	mysql    bool
}

func init() {
	source.Register("prefixed-migrations", &PrefixedMigration{})
}

func (pm *PrefixedMigration) executeTemplate(r io.ReadCloser, identifier string) (io.ReadCloser, string, error) {
	data, err := ioutil.ReadAll(r)
	if err != nil {
		return nil, "", err
	}
	tmpl, err := template.New("sql").Parse(string(data))
	if err != nil {
		return nil, "", err
	}
	buffer := bytes.NewBufferString("")
	err = tmpl.Execute(buffer, map[string]interface{}{"prefix": pm.prefix, "postgres": pm.postgres, "sqlite": pm.sqlite, "mysql": pm.mysql})
	if err != nil {
		return nil, "", err
	}
	return ioutil.NopCloser(bytes.NewReader(buffer.Bytes())), identifier, nil
}

func (pm *PrefixedMigration) ReadUp(version uint) (io.ReadCloser, string, error) {
	r, identifier, err := pm.Bindata.ReadUp(version)
	if err != nil {
		return nil, "", err
	}
	return pm.executeTemplate(r, identifier)
}

func (pm *PrefixedMigration) ReadDown(version uint) (io.ReadCloser, string, error) {
	r, identifier, err := pm.Bindata.ReadDown(version)
	if err != nil {
		return nil, "", err
	}
	return pm.executeTemplate(r, identifier)
}

func (s *SQLStore) Migrate() error {
	var driver database.Driver
	var err error
	migrationsTable := fmt.Sprintf("%sschema_migrations", s.tablePrefix)

	if s.dbType == sqliteDBType {
		driver, err = sqlite3.WithInstance(s.db, &sqlite3.Config{MigrationsTable: migrationsTable})
		if err != nil {
			return err
		}
	}

	if s.dbType == postgresDBType {
		driver, err = postgres.WithInstance(s.db, &postgres.Config{MigrationsTable: migrationsTable})
		if err != nil {
			return err
		}
	}

	if s.dbType == mysqlDBType {
		driver, err = mysql.WithInstance(s.db, &mysql.Config{MigrationsTable: migrationsTable})
		if err != nil {
			return err
		}
	}

	bresource := bindata.Resource(migrations.AssetNames(), migrations.Asset)

	d, err := bindata.WithInstance(bresource)
	if err != nil {
		return err
	}
	prefixedData := &PrefixedMigration{
		Bindata:  d.(*bindata.Bindata),
		prefix:   s.tablePrefix,
		postgres: s.dbType == postgresDBType,
		sqlite:   s.dbType == sqliteDBType,
		mysql:    s.dbType == mysqlDBType,
	}

	m, err := migrate.NewWithInstance("prefixed-migration", prefixedData, s.dbType, driver)
	if err != nil {
		return err
	}
	err = m.Up()
	if err != nil && !errors.Is(err, migrate.ErrNoChange) && !errors.Is(err, os.ErrNotExist) {
		return err
	}

	return nil
}
