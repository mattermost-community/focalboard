// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package main

import (
	"database/sql"

	"github.com/mattermost/focalboard/mattermost-plugin/server/boards"

	"github.com/mattermost/mattermost-server/v6/plugin"

	mm_model "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

type storeService interface {
	GetMasterDB() (*sql.DB, error)
}

// pluginAPIAdapter is an adapter that ensures all Plugin API methods have the same signature as the
// services API.
// Note: this will be removed when plugin builds are no longer needed
type pluginAPIAdapter struct {
	api          plugin.API
	storeService storeService
	logger       mlog.LoggerIFace
}

func newServiceAPIAdapter(api plugin.API, storeService storeService, logger mlog.LoggerIFace) *pluginAPIAdapter {
	return &pluginAPIAdapter{
		api:          api,
		storeService: storeService,
		logger:       logger,
	}
}

//
// Channels service
//

func (a *pluginAPIAdapter) GetDirectChannel(userID1, userID2 string) (*mm_model.Channel, error) {
	return a.api.GetDirectChannel(userID1, userID2)
}

func (a *pluginAPIAdapter) GetChannelByID(channelID string) (*mm_model.Channel, error) {
	return a.api.GetChannel(channelID)
}

func (a *pluginAPIAdapter) GetChannelMember(channelID string, userID string) (*mm_model.ChannelMember, error) {
	return a.api.GetChannelMember(channelID, userID)
}

//
// Post service
//

func (a *pluginAPIAdapter) CreatePost(post *mm_model.Post) (*mm_model.Post, error) {
	return a.api.CreatePost(post)
}

//
// User service
//

func (a *pluginAPIAdapter) GetUserByID(userID string) (*mm_model.User, error) {
	return a.api.GetUser(userID)
}

func (a *pluginAPIAdapter) GetUserByUsername(name string) (*mm_model.User, error) {
	return a.api.GetUserByUsername(name)
}

func (a *pluginAPIAdapter) GetUserByEmail(email string) (*mm_model.User, error) {
	return a.api.GetUserByEmail(email)
}

func (a *pluginAPIAdapter) UpdateUser(user *mm_model.User) (*mm_model.User, error) {
	return a.api.UpdateUser(user)
}

func (a *pluginAPIAdapter) GetUsers(options *mm_model.UserGetOptions) ([]*mm_model.User, error) {
	return a.api.GetUsers(options)
}

//
// Team service
//

func (a *pluginAPIAdapter) GetTeamMember(teamID string, userID string) (*mm_model.TeamMember, error) {
	return a.api.GetTeamMember(teamID, userID)
}

func (a *pluginAPIAdapter) CreateMember(teamID string, userID string) (*mm_model.TeamMember, error) {
	return a.api.CreateTeamMember(teamID, userID)
}

//
// Permissions service
//

func (a *pluginAPIAdapter) HasPermissionToTeam(userID, teamID string, permission *mm_model.Permission) bool {
	return a.api.HasPermissionToTeam(userID, teamID, permission)
}

//
// Bot service
//
func (a *pluginAPIAdapter) EnsureBot(bot *mm_model.Bot) (string, error) {
	return a.api.EnsureBotUser(bot)
}

//
// License service
//
func (a *pluginAPIAdapter) GetLicense() *mm_model.License {
	return a.api.GetLicense()
}

//
// FileInfoStore service
//
func (a *pluginAPIAdapter) GetFileInfo(fileID string) (*mm_model.FileInfo, error) {
	return a.api.GetFileInfo(fileID)
}

//
// Cluster store
//
func (a *pluginAPIAdapter) PublishWebSocketEvent(event string, payload map[string]interface{}, broadcast *mm_model.WebsocketBroadcast) {
	a.api.PublishWebSocketEvent(event, payload, broadcast)
}

func (a *pluginAPIAdapter) PublishPluginClusterEvent(ev mm_model.PluginClusterEvent, opts mm_model.PluginClusterEventSendOptions) error {
	return a.api.PublishPluginClusterEvent(ev, opts)
}

//
// Cloud service
//
func (a *pluginAPIAdapter) GetCloudLimits() (*mm_model.ProductLimits, error) {
	return a.api.GetCloudLimits()
}

//
// Config service
//
func (a *pluginAPIAdapter) GetConfig() *mm_model.Config {
	return a.api.GetUnsanitizedConfig()
}

//
// FileStore service
//

/*
func (a *pluginAPIAdapter) Reader(path string) (filestore.ReadCloseSeeker, error) {
	return a.api.File.filestoreService.Reader(path)
}

func (a *pluginAPIAdapter) FileExists(path string) (bool, error) {
	return a.api.File.filestoreService.FileExists(path)
}

func (a *pluginAPIAdapter) CopyFile(oldPath, newPath string) error {
	return a.api.filestoreService.CopyFile(oldPath, newPath)
}

func (a *pluginAPIAdapter) MoveFile(oldPath, newPath string) error {
	return a.api.filestoreService.MoveFile(oldPath, newPath)
}

func (a *pluginAPIAdapter) WriteFile(fr io.Reader, path string) (int64, error) {
	return a.api.filestoreService.WriteFile(fr, path)
}

func (a *pluginAPIAdapter) RemoveFile(path string) error {
	return a.api.filestoreService.RemoveFile(path)
}
*/

//
// Logger service
//
func (a *pluginAPIAdapter) GetLogger() mlog.LoggerIFace {
	return a.logger
}

//
// KVStore service
//
func (a *pluginAPIAdapter) KVSetWithOptions(key string, value []byte, options mm_model.PluginKVSetOptions) (bool, error) {
	return a.api.KVSetWithOptions(key, value, options)
}

//
// Store service
//
func (a *pluginAPIAdapter) GetMasterDB() (*sql.DB, error) {
	return a.storeService.GetMasterDB()
}

//
// System service
//
func (a *pluginAPIAdapter) GetDiagnosticId() string {
	return a.api.GetDiagnosticId()
}

// Ensure the adapter implements ServicesAPI
var _ boards.ServicesAPI = &pluginAPIAdapter{}
