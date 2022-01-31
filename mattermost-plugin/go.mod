module github.com/mattermost/focalboard/mattermost-plugin

go 1.16

replace github.com/mattermost/focalboard/server => ../server

require (
	github.com/mattermost/focalboard/server v0.0.0-20220131224020-a0185bf514d1
	github.com/mattermost/mattermost-plugin-api v0.0.22
	github.com/mattermost/mattermost-server/v6 v6.3.2
	github.com/stretchr/testify v1.7.0
)
