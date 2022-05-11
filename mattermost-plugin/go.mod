module github.com/mattermost/focalboard/mattermost-plugin

go 1.16

replace github.com/mattermost/focalboard/server => ../server

replace github.com/mattermost/mattermost-server/v6 => /Users/harshilsharma/codebase/go/src/github.com/mattermost/mattermost-server

require (
	github.com/mattermost/focalboard/server v0.0.0-20210525112228-f43e4028dbdc
	github.com/mattermost/mattermost-plugin-api v0.0.21
	github.com/mattermost/mattermost-server/v6 v6.0.0-20220510110708-5d260d4e102f
	github.com/prometheus/common v0.31.1 // indirect
	github.com/prometheus/procfs v0.7.3 // indirect
	github.com/stretchr/testify v1.7.1
)
