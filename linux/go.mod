module github.com/mattermost/focalboard/linux

go 1.16

replace github.com/mattermost/focalboard/server => ../server

require (
	github.com/google/uuid v1.3.0
	github.com/mattermost/focalboard/server v0.0.0-20220325164658-33557093b00d
	github.com/mattermost/mattermost-server/v6 v6.5.0
	github.com/webview/webview v0.0.0-20220314230258-a2b7746141c3
)
