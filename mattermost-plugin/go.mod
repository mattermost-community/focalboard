module github.com/mattermost/focalboard/mattermost-plugin

go 1.12

replace github.com/mattermost/focalboard/server => ../server

replace github.com/mattermost/mattermost-server/v5 => ../../mattermost-server

require (
	github.com/mattermost/focalboard/server v0.0.0-20210331160003-42eaa744c065
	github.com/mattermost/mattermost-server/v5 v5.34.2
	github.com/pkg/errors v0.9.1
	github.com/stretchr/testify v1.7.0
)
