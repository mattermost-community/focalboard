.PHONY: run build

run:
	go run ./main.go

build:
	mkdir -p dist
	# env GOOS=windows GOARCH=amd64 go build -ldflags="-H windowsgui" -o dist/tasks-win.exe
	# env GOOS=windows GOARCH=amd64 go build -ldflags -H=windowsgui -o dist/tasks-win.exe
	env GOOS=windows GOARCH=amd64 go build -o temp/tasks-win.exe
