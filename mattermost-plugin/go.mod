module github.com/mattermost/focalboard/mattermost-plugin

go 1.12

replace github.com/mattermost/focalboard/server => ../server

replace github.com/mattermost/mattermost-plugin-api/v6 => ../../../../../../dev/mattermost-plugin-api

require (
	github.com/mattermost/focalboard/server v0.0.0-20210525112228-f43e4028dbdc
	github.com/mattermost/mattermost-plugin-api/v6 v6.0.0-00010101000000-000000000000
	github.com/mattermost/mattermost-server/v6 v6.0.0-20210817091833-04b27ce93c02
	github.com/pkg/errors v0.9.1
	github.com/stretchr/testify v1.7.0
)
