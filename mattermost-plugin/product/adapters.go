// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package product

import (
	"github.com/mattermost/mattermost-server/v6/app"
	"github.com/mattermost/mattermost-server/v6/app/request"
	mmModel "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/product"
)

type mattermostauthlayerPluginAPIImpl struct {
	userService     product.UserService
	licenseService  product.LicenseService
	channelsService product.ChannelService
}

func newMattermostAuthLayerPluginAPIImpl(services map[app.ServiceKey]interface{}) *mattermostauthlayerPluginAPIImpl {
	us := services[app.UserKey].(product.UserService)
	ls := services[app.LicenseKey].(product.LicenseService)
	cs := services[app.ChannelKey].(product.ChannelService)
	return &mattermostauthlayerPluginAPIImpl{
		userService:     us,
		licenseService:  ls,
		channelsService: cs,
	}
}

func (impl *mattermostauthlayerPluginAPIImpl) GetDirectChannel(userID1, userID2 string) (*mmModel.Channel, *mmModel.AppError) {
	return impl.channelsService.GetDirectChannel(userID1, userID2)
}

func (impl *mattermostauthlayerPluginAPIImpl) GetUser(userID string) (*mmModel.User, *mmModel.AppError) {
	return impl.userService.GetUser(userID)
}

func (impl *mattermostauthlayerPluginAPIImpl) UpdateUser(user *mmModel.User) (*mmModel.User, *mmModel.AppError) {
	return impl.userService.UpdateUser(user, true)
}

func (impl *mattermostauthlayerPluginAPIImpl) GetUserByEmail(email string) (*mmModel.User, *mmModel.AppError) {
	return impl.userService.GetUserByEmail(email)
}

func (impl *mattermostauthlayerPluginAPIImpl) GetUserByUsername(username string) (*mmModel.User, *mmModel.AppError) {
	return impl.userService.GetUserByUsername(username)
}

func (impl *mattermostauthlayerPluginAPIImpl) GetLicense() *mmModel.License {
	return impl.licenseService.GetLicense()
}

type storePluginAPIImpl struct {
	channelsService product.ChannelService
}

func newStorePluginAPIImpl(services map[app.ServiceKey]interface{}) *storePluginAPIImpl {
	cs := services[app.ChannelKey].(product.ChannelService)
	return &storePluginAPIImpl{
		channelsService: cs,
	}
}

func (impl *storePluginAPIImpl) GetChannel(id string) (*mmModel.Channel, *mmModel.AppError) {
	return impl.channelsService.GetChannelByID(id)
}

type mutexAPIImpl struct {
	clusterService product.ClusterService
	logService     product.LogService
}

func newMutexAPIImpl(services map[app.ServiceKey]interface{}) *mutexAPIImpl {
	cs := services[app.ClusterKey].(product.ClusterService)
	ls := services[app.LogKey].(product.LogService)
	return &mutexAPIImpl{
		clusterService: cs,
		logService:     ls,
	}
}

func (impl *mutexAPIImpl) KVSetWithOptions(key string, value []byte, options mmModel.PluginKVSetOptions) (bool, *mmModel.AppError) {
	return impl.clusterService.SetPluginKeyWithOptions("focalboard", key, value, options)
}

func (impl *mutexAPIImpl) LogError(msg string, keyValuePairs ...interface{}) {
	impl.logService.LogError("focalboard", msg, keyValuePairs...)
}

type pluginDeliveriyAPIImpl struct {
	userService     product.UserService
	licenseService  product.LicenseService
	channelsService product.ChannelService
	postService     product.PostService
	teamService     product.TeamService
	botService      product.BotService
	context         *request.Context
}

func newPluginDeliveryAPIImpl(ctx *request.Context, services map[app.ServiceKey]interface{}) *pluginDeliveriyAPIImpl {
	us := services[app.UserKey].(product.UserService)
	ls := services[app.LicenseKey].(product.LicenseService)
	cs := services[app.ChannelKey].(product.ChannelService)
	ps := services[app.PostKey].(product.PostService)
	ts := services[app.TeamKey].(product.TeamService)
	bs := services[app.BotKey].(product.BotService)
	return &pluginDeliveriyAPIImpl{
		userService:     us,
		licenseService:  ls,
		channelsService: cs,
		postService:     ps,
		teamService:     ts,
		botService:      bs,
		context:         ctx,
	}
}

func (impl *pluginDeliveriyAPIImpl) GetDirectChannel(userID1, userID2 string) (*mmModel.Channel, error) {
	return impl.channelsService.GetDirectChannel(userID1, userID2)
}

func (impl *pluginDeliveriyAPIImpl) CreatePost(post *mmModel.Post) error {
	_, err := impl.postService.CreatePost(impl.context, post)
	return err
}

func (impl *pluginDeliveriyAPIImpl) GetUserByID(userID string) (*mmModel.User, error) {
	return impl.userService.GetUser(userID)
}

func (impl *pluginDeliveriyAPIImpl) GetUserByUsername(name string) (*mmModel.User, error) {
	return impl.userService.GetUserByUsername(name)
}

func (impl *pluginDeliveriyAPIImpl) GetTeamMember(teamID string, userID string) (*mmModel.TeamMember, error) {
	return impl.teamService.GetMember(teamID, userID)
}

func (impl *pluginDeliveriyAPIImpl) GetChannelByID(channelID string) (*mmModel.Channel, error) {
	return impl.channelsService.GetChannelByID(channelID)
}

func (impl *pluginDeliveriyAPIImpl) GetChannelMember(channelID string, userID string) (*mmModel.ChannelMember, error) {
	return impl.channelsService.GetChannelMember(channelID, userID)
}

func (impl *pluginDeliveriyAPIImpl) CreateMember(teamID string, userID string) (*mmModel.TeamMember, error) {
	return impl.teamService.CreateMember(impl.context, teamID, userID)
}

func (impl *pluginDeliveriyAPIImpl) EnsureBot(bot *mmModel.Bot) (string, error) {
	return impl.botService.EnsureBot(impl.context, "focalboard", bot)
}

type wsPluginAPIImpl struct {
	clusterService product.ClusterService
	logService     product.LogService
}

func newWSPluginAPIImpl(services map[app.ServiceKey]interface{}) *wsPluginAPIImpl {
	cs := services[app.ClusterKey].(product.ClusterService)
	ls := services[app.LogKey].(product.LogService)
	return &wsPluginAPIImpl{
		clusterService: cs,
		logService:     ls,
	}
}

func (impl *wsPluginAPIImpl) PublishWebSocketEvent(event string, payload map[string]interface{}, broadcast *mmModel.WebsocketBroadcast) {
	impl.clusterService.PublishWebSocketEvent("focalboard", event, payload, broadcast)
}

func (impl *wsPluginAPIImpl) LogError(msg string, keyValuePairs ...interface{}) {
	impl.logService.LogError("focalboard", msg, keyValuePairs...)
}

func (impl *wsPluginAPIImpl) LogWarn(msg string, keyValuePairs ...interface{}) {
	impl.logService.LogWarn("focalboard", msg, keyValuePairs...)
}

func (impl *wsPluginAPIImpl) LogDebug(msg string, keyValuePairs ...interface{}) {
	impl.logService.LogDebug("focalboard", msg, keyValuePairs...)
}

func (impl *wsPluginAPIImpl) PublishPluginClusterEvent(ev mmModel.PluginClusterEvent, opts mmModel.PluginClusterEventSendOptions) error {
	return impl.clusterService.PublishPluginClusterEvent("focalboard", ev, opts)
}

type permissionsPluginAPIImpl struct {
	permissionService product.PermissionService
	logService        product.LogService
}

func newPermissionsPluginAPIImpl(services map[app.ServiceKey]interface{}) *permissionsPluginAPIImpl {
	ps := services[app.PermissionsKey].(product.PermissionService)
	ls := services[app.LogKey].(product.LogService)
	return &permissionsPluginAPIImpl{
		permissionService: ps,
		logService:        ls,
	}
}

func (impl *permissionsPluginAPIImpl) HasPermissionToTeam(userID, teamID string, permission *mmModel.Permission) bool {
	return impl.permissionService.HasPermissionToTeam(userID, teamID, permission)
}

func (impl *permissionsPluginAPIImpl) LogError(msg string, keyValuePairs ...interface{}) {
	impl.logService.LogError("focalboard", msg, keyValuePairs...)
}
