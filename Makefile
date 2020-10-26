.PHONY: prebuild clean cleanall server server-linux generate watch-server mac

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
	cd server; golangci-lint run -p format -p unused -p complexity -p bugs -p performance -E asciicheck -E depguard -E dogsled -E dupl -E funlen -E gochecknoglobals -E gochecknoinits -E goconst -E gocritic -E godot -E godox -E goerr113 -E goheader -E golint -E gomnd -E gomodguard -E goprintffuncname -E gosimple -E interfacer -E lll -E misspell -E nlreturn -E nolintlint -E stylecheck -E unconvert -E whitespace -E wsl --skip-dirs services/store/sqlstore/migrations/ ./...

server-test:
	cd server; go test ./...

server-doc:
	cd server; go doc ./...

watch-server:
	cd server; modd

mac:
	rm -rf mac/resources/bin
	rm -rf mac/resources/pack
	mkdir -p mac/resources
	cp -R bin mac/resources/bin
	cp -R webapp/pack mac/resources/pack
	mkdir -p mac/temp
	xcodebuild archive -workspace mac/Tasks.xcworkspace -scheme Tasks -archivePath mac/temp/tasks.xcarchive
	xcodebuild -exportArchive -archivePath mac/temp/tasks.xcarchive -exportPath mac/dist -exportOptionsPlist mac/export.plist

clean:
	rm -rf bin
	rm -rf dist
	rm -rf webapp/pack
	rm -rf mac/temp
	rm -rf mac/dist

cleanall: clean
	rm -rf webapp/node_modules
