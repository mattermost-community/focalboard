module github.com/mattermost/focalboard/mattermost-plugin

go 1.16

replace github.com/mattermost/focalboard/server => ../server

require (
	github.com/go-bindata/go-bindata v3.1.2+incompatible // indirect
	github.com/jteeuwen/go-bindata v3.0.7+incompatible // indirect
	github.com/mattermost/focalboard/server v0.0.0-20210525112228-f43e4028dbdc
	github.com/mattermost/go-bindata v3.0.7+incompatible // indirect
	github.com/mattermost/mattermost-plugin-api v0.0.21
	github.com/mattermost/mattermost-server/v6 v6.0.0-20220512083839-2c155cdc9510
	github.com/prometheus/common v0.31.1 // indirect
	github.com/stretchr/testify v1.7.1
)
