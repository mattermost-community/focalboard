module github.com/mattermost/focalboard/linux

go 1.15

replace github.com/mattermost/focalboard/server => ../server

require (
	github.com/google/uuid v1.2.0
	github.com/mattermost/focalboard/server v0.0.0-20210422230105-f5ae0b265a8d
	github.com/webview/webview v0.0.0-20200724072439-e0c01595b361
)
