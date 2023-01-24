// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package main

import (
	"database/sql"

	"github.com/gorilla/mux"
	"github.com/mattermost/focalboard/server/model"

	"github.com/mattermost/mattermost-server/v6/plugin"

	mm_model "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

type storeService interface {
	GetMasterDB() (*sql.DB, error)
}

// normalizeAppError returns a truly nil error if appErr is nil
// See https://golang.org/doc/faq#nil_error for more details.
func normalizeAppErr(appErr *mm_model.AppError) error {
	if appErr == nil {
		return nil
	}
	return appErr
}

// pluginAPIAdapter is an adapter that ensures all Plugin API methods have the same signature as the
// services API.
// Note: this will be removed when plugin builds are no longer needed.
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
// Channels service.
//

func (a *pluginAPIAdapter) GetDirectChannel(userID1, userID2 string) (*mm_model.Channel, error) {
	channel, appErr := a.api.GetDirectChannel(userID1, userID2)
	return channel, normalizeAppErr(appErr)
}

func (a *pluginAPIAdapter) GetDirectChannelOrCreate(userID1, userID2 string) (*mm_model.Channel, error) {
	// plugin API's GetDirectChannel will create channel if it does not exist.
	channel, appErr := a.api.GetDirectChannel(userID1, userID2)
	return channel, normalizeAppErr(appErr)
}

func (a *pluginAPIAdapter) GetChannelByID(channelID string) (*mm_model.Channel, error) {
	channel, appErr := a.api.GetChannel(channelID)
	return channel, normalizeAppErr(appErr)
}

func (a *pluginAPIAdapter) GetChannelMember(channelID string, userID string) (*mm_model.ChannelMember, error) {
	member, appErr := a.api.GetChannelMember(channelID, userID)
	return member, normalizeAppErr(appErr)
}

func (a *pluginAPIAdapter) GetChannelsForTeamForUser(teamID string, userID string, includeDeleted bool) (mm_model.ChannelList, error) {
	channels, appErr := a.api.GetChannelsForTeamForUser(teamID, userID, includeDeleted)
	return channels, normalizeAppErr(appErr)
}

//
// Post service.
//

func (a *pluginAPIAdapter) CreatePost(post *mm_model.Post) (*mm_model.Post, error) {
	post, appErr := a.api.CreatePost(post)
	return post, normalizeAppErr(appErr)
}

//
// User service.
//

func (a *pluginAPIAdapter) GetUserByID(userID string) (*mm_model.User, error) {
	user, appErr := a.api.GetUser(userID)
	return user, normalizeAppErr(appErr)
}

func (a *pluginAPIAdapter) GetUserByUsername(name string) (*mm_model.User, error) {
	user, appErr := a.api.GetUserByUsername(name)
	return user, normalizeAppErr(appErr)
}

func (a *pluginAPIAdapter) GetUserByEmail(email string) (*mm_model.User, error) {
	user, appErr := a.api.GetUserByEmail(email)
	return user, normalizeAppErr(appErr)
}

func (a *pluginAPIAdapter) UpdateUser(user *mm_model.User) (*mm_model.User, error) {
	user, appErr := a.api.UpdateUser(user)
	return user, normalizeAppErr(appErr)
}

func (a *pluginAPIAdapter) GetUsersFromProfiles(options *mm_model.UserGetOptions) ([]*mm_model.User, error) {
	users, appErr := a.api.GetUsers(options)
	return users, normalizeAppErr(appErr)
}

//
// Team service.
//

func (a *pluginAPIAdapter) GetTeamMember(teamID string, userID string) (*mm_model.TeamMember, error) {
	member, appErr := a.api.GetTeamMember(teamID, userID)
	return member, normalizeAppErr(appErr)
}

func (a *pluginAPIAdapter) CreateMember(teamID string, userID string) (*mm_model.TeamMember, error) {
	member, appErr := a.api.CreateTeamMember(teamID, userID)
	return member, normalizeAppErr(appErr)
}

//
// Permissions service.
//

func (a *pluginAPIAdapter) HasPermissionTo(userID string, permission *mm_model.Permission) bool {
	return a.api.HasPermissionTo(userID, permission)
}

func (a *pluginAPIAdapter) HasPermissionToTeam(userID, teamID string, permission *mm_model.Permission) bool {
	return a.api.HasPermissionToTeam(userID, teamID, permission)
}

func (a *pluginAPIAdapter) HasPermissionToChannel(askingUserID string, channelID string, permission *mm_model.Permission) bool {
	return a.api.HasPermissionToChannel(askingUserID, channelID, permission)
}

//
// Bot service.
//

func (a *pluginAPIAdapter) EnsureBot(bot *mm_model.Bot) (string, error) {
	return a.api.EnsureBotUser(bot)
}

//
// License service.
//

func (a *pluginAPIAdapter) GetLicense() *mm_model.License {
	return a.api.GetLicense()
}

//
// FileInfoStore service.
//

func (a *pluginAPIAdapter) GetFileInfo(fileID string) (*mm_model.FileInfo, error) {
	fi, appErr := a.api.GetFileInfo(fileID)
	return fi, normalizeAppErr(appErr)
}

//
// Cluster store.
//

func (a *pluginAPIAdapter) PublishWebSocketEvent(event string, payload map[string]interface{}, broadcast *mm_model.WebsocketBroadcast) {
	a.api.PublishWebSocketEvent(event, payload, broadcast)
}

func (a *pluginAPIAdapter) PublishPluginClusterEvent(ev mm_model.PluginClusterEvent, opts mm_model.PluginClusterEventSendOptions) error {
	return a.api.PublishPluginClusterEvent(ev, opts)
}

//
// Cloud service.
//

func (a *pluginAPIAdapter) GetCloudLimits() (*mm_model.ProductLimits, error) {
	return a.api.GetCloudLimits()
}

//
// Config service.
//

func (a *pluginAPIAdapter) GetConfig() *mm_model.Config {
	return a.api.GetUnsanitizedConfig()
}

//
// Logger service.
//

func (a *pluginAPIAdapter) GetLogger() mlog.LoggerIFace {
	return a.logger
}

//
// KVStore service.
//

func (a *pluginAPIAdapter) KVSetWithOptions(key string, value []byte, options mm_model.PluginKVSetOptions) (bool, error) {
	b, appErr := a.api.KVSetWithOptions(key, value, options)
	return b, normalizeAppErr(appErr)
}

//
// Store service.
//

func (a *pluginAPIAdapter) GetMasterDB() (*sql.DB, error) {
	return a.storeService.GetMasterDB()
}

//
// System service.
//

func (a *pluginAPIAdapter) GetDiagnosticID() string {
	return a.api.GetDiagnosticId()
}

//
// Router service.
//

func (a *pluginAPIAdapter) RegisterRouter(sub *mux.Router) {
	// NOOP for plugin
}

//
// Preferences service.
//

func (a *pluginAPIAdapter) GetPreferencesForUser(userID string) (mm_model.Preferences, error) {
	preferences, appErr := a.api.GetPreferencesForUser(userID)
	if appErr != nil {
		return nil, normalizeAppErr(appErr)
	}

	boardsPreferences := mm_model.Preferences{}

	// Mattermost API gives us all preferences.
	// We want just the Focalboard ones.
	for _, preference := range preferences {
		if preference.Category == model.PreferencesCategoryFocalboard {
			boardsPreferences = append(boardsPreferences, preference)
		}
	}

	return boardsPreferences, nil
}

func (a *pluginAPIAdapter) UpdatePreferencesForUser(userID string, preferences mm_model.Preferences) error {
	appErr := a.api.UpdatePreferencesForUser(userID, preferences)
	return normalizeAppErr(appErr)
}

func (a *pluginAPIAdapter) DeletePreferencesForUser(userID string, preferences mm_model.Preferences) error {
	appErr := a.api.DeletePreferencesForUser(userID, preferences)
	return normalizeAppErr(appErr)
}

// Ensure the adapter implements ServicesAPI.
var _ model.ServicesAPI = &pluginAPIAdapter{}
