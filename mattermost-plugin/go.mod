module github.com/mattermost/focalboard/mattermost-plugin

go 1.12

replace github.com/mattermost/focalboard/server => ../server

replace github.com/mattermost/mattermost-server/v6 => ../../mattermost-server

replace github.com/mattermost/mattermost-plugin-api/v6 => ../../../../../../dev/mattermost-plugin-api

require (
	github.com/mattermost/focalboard/server v0.0.0-20210525112228-f43e4028dbdc
	github.com/mattermost/mattermost-plugin-api v0.0.19 // indirect
	github.com/mattermost/mattermost-plugin-api/v6 v6.0.0-00010101000000-000000000000
	github.com/mattermost/mattermost-server/v6 v6.0.0-20210819192026-ab0e82d65692
	github.com/pkg/errors v0.9.1
	github.com/stretchr/testify v1.7.0
)
