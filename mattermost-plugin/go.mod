module github.com/mattermost/focalboard/mattermost-plugin

go 1.12

replace github.com/mattermost/focalboard/server => ../server

require (
	github.com/mattermost/focalboard/server v0.0.0-20210525112228-f43e4028dbdc
	github.com/mattermost/mattermost-plugin-api v0.0.16
	github.com/mattermost/mattermost-server/v5 v5.3.2-0.20210621071817-df224571d8a1
	github.com/pkg/errors v0.9.1
	github.com/stretchr/testify v1.7.0
)
