module github.com/mattermost/focalboard/linux

go 1.16

replace github.com/mattermost/focalboard/server => ../server

require (
	github.com/google/uuid v1.3.0
	github.com/mattermost/focalboard/server v0.0.0-20210422230105-f5ae0b265a8d
	github.com/mattermost/mattermost-server/v6 v6.0.0-20211022142730-a6cca93ba3c3
	github.com/webview/webview v0.0.0-20200724072439-e0c01595b361
)
