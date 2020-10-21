.PHONY: prebuild clean cleanall server server-linux generate watch-server

all: server

prebuild:
	go get github.com/gorilla/mux
	go get github.com/gorilla/websocket
	go get github.com/spf13/viper
	go get github.com/lib/pq
	go get github.com/mattn/go-sqlite3

server:
	cd server; go build -o ../bin/octoserver ./main

server-linux:
	cd server; env GOOS=linux GOARCH=amd64 go build -o ../bin/octoserver ./main

generate:
	cd server; go get -modfile=go.tools.mod github.com/golang/mock/mockgen
	cd server; go get -modfile=go.tools.mod github.com/jteeuwen/go-bindata
	cd server; go generate ./...

server-lint:
	@if ! [ -x "$$(command -v golangci-lint)" ]; then \
        echo "golangci-lint is not installed. Please see https://github.com/golangci/golangci-lint#install for installation instructions."; \
        exit 1; \
    fi; \
    cd server; golangci-lint run ./...

server-test:
	cd server; go test ./...

watch-server:
	cd server; modd

clean:
	rm -rf bin
	rm -rf dist
	rm -rf webapp/pack

cleanall: clean
	rm -rf webapp/node_modules
