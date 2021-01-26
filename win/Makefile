.PHONY: run build

run:
	go run ./main.go

build:
	mkdir -p dist
	# env GOOS=windows GOARCH=amd64 go build -ldflags="-H windowsgui" -o dist/focalboard.exe
	# env GOOS=windows GOARCH=amd64 go build -ldflags -H=windowsgui -o dist/focalboard.exe
	env GOOS=windows GOARCH=amd64 go build -o temp/focalboard.exe
