module github.com/mattermost/focalboard/mattermost-plugin

go 1.12

replace github.com/mattermost/focalboard/server => ../server

require (
	github.com/mattermost/focalboard/server v0.0.0-20210525112228-f43e4028dbdc
	github.com/mattermost/mattermost-server/v5 v5.3.2-0.20210524045451-a4f7df6f6e3c
	github.com/pkg/errors v0.9.1
	github.com/stretchr/testify v1.7.0
)
