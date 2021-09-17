module github.com/mattermost/focalboard/mattermost-plugin

go 1.16

replace github.com/mattermost/focalboard/server => ../server

require (
	github.com/mattermost/focalboard/server v0.0.0-20210525112228-f43e4028dbdc
	github.com/mattermost/mattermost-plugin-api v0.0.20
	github.com/mattermost/mattermost-server/v6 v6.0.0-20210916195902-80062c22f89b
	github.com/pkg/errors v0.9.1
	github.com/stretchr/testify v1.7.0
)
