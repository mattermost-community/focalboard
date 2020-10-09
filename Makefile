.PHONY: prebuild clean cleanall pack packdev builddev build watch go goUbuntu

all: build

GOMAIN = ./server/main
GOBIN = ./bin/octoserver

pack:
	npm run pack

packdev:
	npm run packdev

go:
	go build -o $(GOBIN) $(GOMAIN)

goUbuntu:
	env GOOS=linux GOARCH=amd64 go build -o $(GOBIN) $(GOMAIN)

builddev: packdev go

build: pack go

watch:
	npm run watchdev

prebuild:
	npm install
	go get github.com/gorilla/mux
	go get github.com/gorilla/websocket
	go get github.com/spf13/viper
	go get github.com/lib/pq
	go get github.com/mattn/go-sqlite3

clean:
	rm -rf bin
	rm -rf dist
	rm -rf pack

cleanall: clean
	rm -rf node_modules
