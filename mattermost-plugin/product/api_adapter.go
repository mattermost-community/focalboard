// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package product

import (
	"database/sql"

	"github.com/mattermost/mattermost-server/v6/app/request"
	mm_model "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"

	"github.com/mattermost/focalboard/server/model"
)

// serviceAPIAdapter is an adapter that flattens the APIs provided by suite services so they can
// be used as per the Plugin API.
// Note: when supporting a plugin build is no longer needed this adapter may be removed as the Boards app
//       can be modified to use the services in modular fashion.
type serviceAPIAdapter struct {
	api *boardsProduct
	ctx *request.Context
}

func newServiceAPIAdapter(api *boardsProduct) *serviceAPIAdapter {
	return &serviceAPIAdapter{
		api: api,
		ctx: &request.Context{},
	}
}

//
// Channels service
//

func (a *serviceAPIAdapter) GetDirectChannel(userID1, userID2 string) (*mm_model.Channel, error) {
	return a.api.channelService.GetDirectChannel(userID1, userID2)
}

func (a *serviceAPIAdapter) GetChannelByID(channelID string) (*mm_model.Channel, error) {
	return a.api.channelService.GetChannelByID(channelID)
}

func (a *serviceAPIAdapter) GetChannelMember(channelID string, userID string) (*mm_model.ChannelMember, error) {
	return a.api.channelService.GetChannelMember(channelID, userID)
}

//
// Post service
//

func (a *serviceAPIAdapter) CreatePost(post *mm_model.Post) (*mm_model.Post, error) {
	return a.api.postService.CreatePost(a.ctx, post)
}

//
// User service
//

func (a *serviceAPIAdapter) GetUserByID(userID string) (*mm_model.User, error) {
	return a.api.userService.GetUser(userID)
}

func (a *serviceAPIAdapter) GetUserByUsername(name string) (*mm_model.User, error) {
	return a.api.userService.GetUserByUsername(name)
}

func (a *serviceAPIAdapter) GetUserByEmail(email string) (*mm_model.User, error) {
	return a.api.userService.GetUserByEmail(email)
}

func (a *serviceAPIAdapter) UpdateUser(user *mm_model.User) (*mm_model.User, error) {
	return a.api.userService.UpdateUser(user, true)
}

func (a *serviceAPIAdapter) GetUsers(options *mm_model.UserGetOptions) ([]*mm_model.User, error) {
	return a.api.userService.GetUsers(options)
}

//
// Team service
//

func (a *serviceAPIAdapter) GetTeamMember(teamID string, userID string) (*mm_model.TeamMember, error) {
	return a.api.teamService.GetMember(teamID, userID)
}

func (a *serviceAPIAdapter) CreateMember(teamID string, userID string) (*mm_model.TeamMember, error) {
	return a.api.teamService.CreateMember(a.ctx, teamID, userID)
}

//
// Permissions service
//

func (a *serviceAPIAdapter) HasPermissionToTeam(userID, teamID string, permission *mm_model.Permission) bool {
	return a.api.permissionsService.HasPermissionToTeam(userID, teamID, permission)
}

//
// Bot service
//
func (a *serviceAPIAdapter) EnsureBot(bot *mm_model.Bot) (string, error) {
	return a.api.botService.EnsureBot(a.ctx, boardsProductID, bot)
}

//
// License service
//
func (a *serviceAPIAdapter) GetLicense() *mm_model.License {
	return a.api.licenseService.GetLicense()
}

//
// FileInfoStore service
//
func (a *serviceAPIAdapter) GetFileInfo(fileID string) (*mm_model.FileInfo, error) {
	return a.api.fileInfoStoreService.GetFileInfo(fileID)
}

//
// Cluster store
//
func (a *serviceAPIAdapter) PublishWebSocketEvent(event string, payload map[string]interface{}, broadcast *mm_model.WebsocketBroadcast) {
	a.api.clusterService.PublishWebSocketEvent(boardsProductID, event, payload, broadcast)
}

func (a *serviceAPIAdapter) PublishPluginClusterEvent(ev mm_model.PluginClusterEvent, opts mm_model.PluginClusterEventSendOptions) error {
	return a.api.clusterService.PublishPluginClusterEvent(boardsProductID, ev, opts)
}

//
// Cloud service
//
func (a *serviceAPIAdapter) GetCloudLimits() (*mm_model.ProductLimits, error) {
	return a.api.cloudService.GetCloudLimits()
}

//
// Config service
//
func (a *serviceAPIAdapter) GetConfig() *mm_model.Config {
	return a.api.configService.Config()
}

//
// FileStore service
//
/*
func (a *serviceAPIAdapter) Reader(path string) (filestore.ReadCloseSeeker, error) {
	return a.api.filestoreService.Reader(path)
}

func (a *serviceAPIAdapter) FileExists(path string) (bool, error) {
	return a.api.filestoreService.FileExists(path)
}

func (a *serviceAPIAdapter) CopyFile(oldPath, newPath string) error {
	return a.api.filestoreService.CopyFile(oldPath, newPath)
}

func (a *serviceAPIAdapter) MoveFile(oldPath, newPath string) error {
	return a.api.filestoreService.MoveFile(oldPath, newPath)
}

func (a *serviceAPIAdapter) WriteFile(fr io.Reader, path string) (int64, error) {
	return a.api.filestoreService.WriteFile(fr, path)
}

func (a *serviceAPIAdapter) RemoveFile(path string) error {
	return a.api.filestoreService.RemoveFile(path)
}
*/

//
// Logger service
//
func (a *serviceAPIAdapter) GetLogger() mlog.LoggerIFace {
	return a.api.logger
}

//
// KVStore service
//
func (a *serviceAPIAdapter) KVSetWithOptions(key string, value []byte, options mm_model.PluginKVSetOptions) (bool, error) {
	return a.api.kvStoreService.SetPluginKeyWithOptions(boardsProductID, key, value, options)
}

//
// Store service
//
func (a *serviceAPIAdapter) GetMasterDB() (*sql.DB, error) {
	return a.api.storeService.GetMasterDB(), nil
}

//
// System service
//
func (a *serviceAPIAdapter) GetDiagnosticId() string {
	return a.api.systemService.GetDiagnosticId()
}

// Ensure the adapter implements ServicesAPI
var _ model.ServicesAPI = &serviceAPIAdapter{}
