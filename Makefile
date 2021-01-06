.PHONY: prebuild clean cleanall server server-mac server-linux server-win server-linux-package generate watch-server webapp mac-app win-app linux-app

PACKAGE_FOLDER = octo

all: server

prebuild:
	go get github.com/gorilla/mux
	go get github.com/gorilla/websocket
	go get github.com/spf13/viper
	go get github.com/lib/pq
	go get github.com/mattn/go-sqlite3
	cd webapp; npm install

server:
	cd server; go build -o ../bin/octoserver ./main

server-mac:
	mkdir -p bin/mac
	cd server; env GOOS=darwin GOARCH=amd64 go build -o ../bin/mac/octoserver ./main

server-linux:
	mkdir -p bin/linux
	cd server; env GOOS=linux GOARCH=amd64 go build -o ../bin/linux/octoserver ./main

server-win:
	cd server; env GOOS=windows GOARCH=amd64 go build -o ../bin/octoserver.exe ./main

server-linux-package: server-linux webapp
	rm -rf package
	mkdir -p package/${PACKAGE_FOLDER}/bin
	cp bin/linux/octoserver package/${PACKAGE_FOLDER}/bin
	cp -R webapp/pack package/${PACKAGE_FOLDER}/pack
	cp config.json package/${PACKAGE_FOLDER}
	mkdir -p dist
	cd package && tar -czvf ../dist/octo-linux-amd64.tar.gz ${PACKAGE_FOLDER}
	rm -rf package

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

webapp:
	cd webapp; npm run pack

mac-app: server-mac webapp
	rm -rf mac/resources/bin
	rm -rf mac/resources/pack
	mkdir -p mac/resources/bin
	cp bin/mac/octoserver mac/resources/bin/octoserver
	cp -R webapp/pack mac/resources/pack
	mkdir -p mac/temp
	xcodebuild archive -workspace mac/Tasks.xcworkspace -scheme Tasks -archivePath mac/temp/tasks.xcarchive
	xcodebuild -exportArchive -archivePath mac/temp/tasks.xcarchive -exportPath mac/dist -exportOptionsPlist mac/export.plist
	cd mac/dist; zip -r tasks-mac.zip Tasks.app

win-app: server-win webapp
	cd win; make build
	mkdir -p win/dist/bin
	cp -R bin/octoserver.exe win/dist/bin
	cp -R config.json win/dist
	mkdir -p win/dist/webapp
	cp -R webapp/pack win/dist/webapp/pack
	# cd win/dist; zip -r ../tasks-win.zip .

linux-app: server-linux webapp
	rm -rf linux/temp
	mkdir -p linux/temp/tasks-app/webapp
	mkdir -p linux/dist
	cp -R bin/linux/octoserver linux/temp/tasks-app/
	cp -R config.json linux/temp/tasks-app/
	cp -R webapp/pack linux/temp/tasks-app/webapp/pack
	cd linux; make build
	cp -R linux/bin/tasks-app linux/temp/tasks-app/
	cd linux/temp; tar -zcf ../dist/tasks-linux.tar.gz tasks-app
	rm -rf linux/temp

clean:
	rm -rf bin
	rm -rf dist
	rm -rf webapp/pack
	rm -rf mac/temp
	rm -rf mac/dist
	rm -rf linux/dist
	rm -rf win/dist

cleanall: clean
	rm -rf webapp/node_modules
