module github.com/mattermost/focalboard/mattermost-plugin

go 1.16

replace github.com/mattermost/focalboard/server => ../server

require (
	github.com/golang/mock v1.6.0
	github.com/mattermost/focalboard/server v0.0.0-20220325164658-33557093b00d
	github.com/mattermost/mattermost-plugin-api v0.0.27
	github.com/mattermost/mattermost-server/v6 v6.5.0
	github.com/stretchr/testify v1.7.1
)
