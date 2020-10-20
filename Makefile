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
	cd server; go generate ./...

watch-server:
	cd server; modd

clean:
	rm -rf bin
	rm -rf dist
	rm -rf webapp/pack

cleanall: clean
	rm -rf webapp/node_modules
