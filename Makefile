.PHONY: prebuild clean cleanall ci generate modd-precheck templates-archive

PACKAGE_FOLDER = focalboard

# Build Flags
BUILD_NUMBER ?= $(BUILD_NUMBER:)
BUILD_DATE = $(shell date -u)
BUILD_HASH = $(shell git rev-parse HEAD)
# If we don't set the build number it defaults to dev
ifeq ($(BUILD_NUMBER),)
	BUILD_NUMBER := dev
	BUILD_DATE := n/a
endif

BUILD_TAGS += json1 sqlite3

LDFLAGS += -X "github.com/mattermost/focalboard/server/model.BuildNumber=$(BUILD_NUMBER)"
LDFLAGS += -X "github.com/mattermost/focalboard/server/model.BuildDate=$(BUILD_DATE)"
LDFLAGS += -X "github.com/mattermost/focalboard/server/model.BuildHash=$(BUILD_HASH)"

RACE = -race

ifeq ($(OS),Windows_NT)
	RACE := ''
endif

# MAC cpu architecture
ifeq ($(shell uname -m),arm64)
	MAC_GO_ARCH := arm64
else
	MAC_GO_ARCH := amd64
endif

all: ci ## Simulate CI, locally.

ci: webapp-ci server-test ## Simulate CI, locally.

setup-go-work: export EXCLUDE_ENTERPRISE ?= true
setup-go-work: ## Sets up a go.work file
	go run ./build/gowork/main.go

templates-archive: setup-go-work ## Build templates archive file
	cd server/assets/build-template-archive; go run -tags '$(BUILD_TAGS)' main.go --dir="../templates-boardarchive" --out="../templates.boardarchive"

generate: ## Install and run code generators.
	cd server; go install github.com/golang/mock/mockgen@v1.6.0
	cd server; go generate ./...

server-lint: setup-go-work ## Run linters on server code.
	@if ! [ -x "$$(command -v golangci-lint)" ]; then \
		echo "golangci-lint is not installed. Please see https://github.com/golangci/golangci-lint#install-golangci-lint for installation instructions."; \
		exit 1; \
	fi;
	cd server; golangci-lint run ./...
	cd mattermost-plugin; golangci-lint run ./...

modd-precheck:
	@if ! [ -x "$$(command -v modd)" ]; then \
		echo "modd is not installed. Please see https://github.com/cortesi/modd#install for installation instructions"; \
		exit 1; \
	fi; \

watch-server-test: modd-precheck ## Run server tests watching for changes
	env FOCALBOARD_BUILD_TAGS='$(BUILD_TAGS)' modd -f modd-servertest.conf

server-test: server-test-sqlite server-test-mysql server-test-mariadb server-test-postgres ## Run server tests

server-test-sqlite: export FOCALBOARD_UNIT_TESTING=1

server-test-sqlite: setup-go-work ## Run server tests using sqlite
	cd server; go test -tags '$(BUILD_TAGS)' -race -v -coverpkg=./... -coverprofile=server-sqlite-profile.coverage -count=1 -timeout=30m ./...
	cd server; go tool cover -func server-sqlite-profile.coverage

server-test-mini-sqlite: export FOCALBOARD_UNIT_TESTING=1

server-test-mini-sqlite: setup-go-work ## Run server tests using sqlite
	cd server/integrationtests; go test -tags '$(BUILD_TAGS)' $(RACE) -v -count=1 -timeout=30m ./...

server-test-mysql: export FOCALBOARD_UNIT_TESTING=1
server-test-mysql: export FOCALBOARD_STORE_TEST_DB_TYPE=mysql
server-test-mysql: export FOCALBOARD_STORE_TEST_DOCKER_PORT=44446

server-test-mysql: setup-go-work ## Run server tests using mysql
	@echo Starting docker container for mysql
	docker-compose -f ./docker-testing/docker-compose-mysql.yml down -v --remove-orphans
	docker-compose -f ./docker-testing/docker-compose-mysql.yml run start_dependencies
	cd server; go test -tags '$(BUILD_TAGS)' -race -v -coverpkg=./... -coverprofile=server-mysql-profile.coverage -count=1 -timeout=30m ./...
	cd server; go tool cover -func server-mysql-profile.coverage
	cd mattermost-plugin/server; go test -tags '$(BUILD_TAGS)' -race -v -coverpkg=./... -coverprofile=plugin-mysql-profile.coverage -count=1 -timeout=30m ./...
	cd mattermost-plugin/server; go tool cover -func plugin-mysql-profile.coverage
	docker-compose -f ./docker-testing/docker-compose-mysql.yml down -v --remove-orphans

server-test-mariadb: export FOCALBOARD_UNIT_TESTING=1
server-test-mariadb: export FOCALBOARD_STORE_TEST_DB_TYPE=mariadb
server-test-mariadb: export FOCALBOARD_STORE_TEST_DOCKER_PORT=44445

server-test-mariadb: templates-archive ## Run server tests using mysql
	@echo Starting docker container for mariadb
	docker-compose -f ./docker-testing/docker-compose-mariadb.yml down -v --remove-orphans
	docker-compose -f ./docker-testing/docker-compose-mariadb.yml run start_dependencies
	cd server; go test -tags '$(BUILD_TAGS)' -race -v -coverpkg=./... -coverprofile=server-mariadb-profile.coverage -count=1 -timeout=30m ./...
	cd server; go tool cover -func server-mariadb-profile.coverage
	cd mattermost-plugin/server; go test -tags '$(BUILD_TAGS)' -race -v -coverpkg=./... -coverprofile=plugin-mariadb-profile.coverage -count=1 -timeout=30m ./...
	cd mattermost-plugin/server; go tool cover -func plugin-mariadb-profile.coverage
	docker-compose -f ./docker-testing/docker-compose-mariadb.yml down -v --remove-orphans

server-test-postgres: export FOCALBOARD_UNIT_TESTING=1
server-test-postgres: export FOCALBOARD_STORE_TEST_DB_TYPE=postgres
server-test-postgres: export FOCALBOARD_STORE_TEST_DOCKER_PORT=44447

server-test-postgres: setup-go-work ## Run server tests using postgres
	@echo Starting docker container for postgres
	docker-compose -f ./docker-testing/docker-compose-postgres.yml down -v --remove-orphans
	docker-compose -f ./docker-testing/docker-compose-postgres.yml run start_dependencies
	cd server; go test -tags '$(BUILD_TAGS)' -race -v -coverpkg=./... -coverprofile=server-postgres-profile.coverage -count=1 -timeout=30m ./...
	cd server; go tool cover -func server-postgres-profile.coverage
	cd mattermost-plugin/server; go test -tags '$(BUILD_TAGS)' -race -v -coverpkg=./... -coverprofile=plugin-postgres-profile.coverage -count=1 -timeout=30m ./...
	cd mattermost-plugin/server; go tool cover -func plugin-postgres-profile.coverage
	docker-compose -f ./docker-testing/docker-compose-postgres.yml down -v --remove-orphans

webapp-ci: ## Webapp CI: linting & testing.
	cd webapp; npm run check
	cd mattermost-plugin/webapp; npm run lint
	cd webapp; npm run test
	cd mattermost-plugin/webapp; npm run test
	cd webapp; npm run cypress:ci

webapp-test: ## jest tests for webapp
	cd webapp; npm run test

watch-plugin: modd-precheck ## Run and upload the plugin to a development server
	env FOCALBOARD_BUILD_TAGS='$(BUILD_TAGS)' modd -f modd-watchplugin.conf

live-watch-plugin: modd-precheck ## Run and update locally the plugin in the development server
	cd mattermost-plugin; make live-watch

.PHONY: build-product
build-product: ## Builds the product as something the Mattermost server will pull files from when packaging a release
	cd mattermost-plugin; make build-product

.PHONY: watch-product
watch-product: ## Run the product as something the Mattermost web app will watch for
	cd mattermost-plugin; make watch-product

swagger: ## Generate swagger API spec and clients based on it.
	mkdir -p server/swagger/docs
	mkdir -p server/swagger/clients
	cd server && swagger generate spec -m -o ./swagger/swagger.yml

	cd server/swagger && openapi-generator generate -i swagger.yml -g html2 -o docs/html
	cd server/swagger && openapi-generator generate -i swagger.yml -g go -o clients/go
	cd server/swagger && openapi-generator generate -i swagger.yml -g javascript -o clients/javascript
	cd server/swagger && openapi-generator generate -i swagger.yml -g typescript-fetch -o clients/typescript
	cd server/swagger && openapi-generator generate -i swagger.yml -g swift5 -o clients/swift
	cd server/swagger && openapi-generator generate -i swagger.yml -g python -o clients/python

clean: ## Clean build artifacts.
	rm -rf webapp/pack

cleanall: clean ## Clean all build artifacts and dependencies.
	rm -rf webapp/node_modules

## Help documentatin à la https://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
help:
	@grep -E '^[0-9a-zA-Z_-]+:.*?## .*$$' ./Makefile | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
