module github.com/mattermost/focalboard/server

go 1.16

require (
	github.com/Masterminds/squirrel v1.5.0
	github.com/go-sql-driver/mysql v1.6.0
	github.com/golang-migrate/migrate/v4 v4.15.0
	github.com/golang/mock v1.6.0
	github.com/gorilla/mux v1.8.0
	github.com/gorilla/websocket v1.4.2
	github.com/lib/pq v1.10.3
	github.com/mattermost/mattermost-server/v6 v6.0.0-20211022142730-a6cca93ba3c3
	github.com/mattn/go-sqlite3 v2.0.3+incompatible
	github.com/oklog/run v1.1.0
	github.com/pkg/errors v0.9.1
	github.com/prometheus/client_golang v1.11.0
	github.com/rudderlabs/analytics-go v3.3.1+incompatible
	github.com/spf13/viper v1.8.1
	github.com/stretchr/testify v1.7.0
	github.com/wiggin77/merror v1.0.3
	golang.org/x/crypto v0.0.0-20210921155107-089bfa567519
)
