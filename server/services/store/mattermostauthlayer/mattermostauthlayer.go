package mattermostauthlayer

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"

	"github.com/mattermost/mattermost-server/v6/plugin"

	"github.com/pkg/errors"

	sq "github.com/Masterminds/squirrel"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"
	mmModel "github.com/mattermost/mattermost-server/v6/model"

	pluginapi "github.com/mattermost/mattermost-plugin-api"
)

const (
	sqliteDBType   = "sqlite3"
	postgresDBType = "postgres"
	mysqlDBType    = "mysql"

	directChannelType         = "D"
	nonTemplateFilterMySQL    = "focalboard_blocks.fields LIKE '%\"isTemplate\":false%'"
	nonTemplateFilterPostgres = "focalboard_blocks.fields ->> 'isTemplate' = 'false'"
)

var (
	errUnsupportedDatabaseError = errors.New("method is unsupported on current database. Supported databases are - MySQL and PostgreSQL")
)

type NotSupportedError struct {
	msg string
}

func (pe NotSupportedError) Error() string {
	return pe.msg
}

var systemsBot = &mmModel.Bot{
	Username:    mmModel.BotSystemBotUsername,
	DisplayName: "System",
}

// Store represents the abstraction of the data storage.
type MattermostAuthLayer struct {
	store.Store
	dbType    string
	mmDB      *sql.DB
	logger    *mlog.Logger
	pluginAPI plugin.API
	client    *pluginapi.Client
}

// New creates a new SQL implementation of the store.
func New(
	dbType string,
	db *sql.DB,
	store store.Store,
	logger *mlog.Logger,
	pluginAPI plugin.API,
	client *pluginapi.Client,
) (*MattermostAuthLayer, error) {
	layer := &MattermostAuthLayer{
		Store:     store,
		dbType:    dbType,
		mmDB:      db,
		logger:    logger,
		pluginAPI: pluginAPI,
		client:    client,
	}

	return layer, nil
}

// Shutdown close the connection with the store.
func (s *MattermostAuthLayer) Shutdown() error {
	return s.Store.Shutdown()
}

func (s *MattermostAuthLayer) GetRegisteredUserCount() (int, error) {
	query := s.getQueryBuilder().
		Select("count(*)").
		From("Users").
		Where(sq.Eq{"deleteAt": 0})
	row := query.QueryRow()

	var count int
	err := row.Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

func (s *MattermostAuthLayer) getUserByCondition(condition sq.Eq) (*model.User, error) {
	users, err := s.getUsersByCondition(condition)
	if err != nil {
		return nil, err
	}

	var user *model.User
	for _, u := range users {
		user = u
		break
	}

	return user, nil
}

func (s *MattermostAuthLayer) getUsersByCondition(condition sq.Eq) (map[string]*model.User, error) {
	query := s.getQueryBuilder().
		Select("id", "username", "email", "password", "MFASecret as mfa_secret", "AuthService as auth_service", "COALESCE(AuthData, '') as auth_data",
			"props", "CreateAt as create_at", "UpdateAt as update_at", "DeleteAt as delete_at, Roles").
		From("Users").
		Where(sq.Eq{"deleteAt": 0}).
		Where(condition)
	row, err := query.Query()
	if err != nil {
		return nil, err
	}

	users := map[string]*model.User{}

	for row.Next() {
		user := model.User{}

		var propsBytes []byte
		err := row.Scan(&user.ID, &user.Username, &user.Email, &user.Password, &user.MfaSecret, &user.AuthService,
			&user.AuthData, &propsBytes, &user.CreateAt, &user.UpdateAt, &user.DeleteAt, &user.Roles)
		if err != nil {
			return nil, err
		}

		err = json.Unmarshal(propsBytes, &user.Props)
		if err != nil {
			return nil, err
		}

		users[user.ID] = &user
	}

	return users, nil
}

func (s *MattermostAuthLayer) GetUserByID(userID string) (*model.User, error) {
	return s.getUserByCondition(sq.Eq{"id": userID})
}

func (s *MattermostAuthLayer) GetUserByEmail(email string) (*model.User, error) {
	return s.getUserByCondition(sq.Eq{"email": email})
}

func (s *MattermostAuthLayer) GetUserByUsername(username string) (*model.User, error) {
	return s.getUserByCondition(sq.Eq{"username": username})
}

func (s *MattermostAuthLayer) CreateUser(user *model.User) error {
	return NotSupportedError{"no user creation allowed from focalboard, create it using mattermost"}
}

func (s *MattermostAuthLayer) UpdateUser(user *model.User) error {
	return NotSupportedError{"no update allowed from focalboard, update it using mattermost"}
}

func (s *MattermostAuthLayer) UpdateUserPassword(username, password string) error {
	return NotSupportedError{"no update allowed from focalboard, update it using mattermost"}
}

func (s *MattermostAuthLayer) UpdateUserPasswordByID(userID, password string) error {
	return NotSupportedError{"no update allowed from focalboard, update it using mattermost"}
}

func (s *MattermostAuthLayer) PatchUserProps(userID string, patch model.UserPropPatch) error {
	user, err := s.pluginAPI.GetUser(userID)
	if err != nil {
		s.logger.Error("failed to fetch user", mlog.String("userID", userID), mlog.Err(err))
		return err
	}

	props := user.Props

	for _, key := range patch.DeletedFields {
		delete(props, key)
	}

	for key, value := range patch.UpdatedFields {
		props[key] = value
	}

	user.Props = props

	if _, err := s.pluginAPI.UpdateUser(user); err != nil {
		s.logger.Error("failed to update user", mlog.String("userID", userID), mlog.Err(err))
		return err
	}

	return nil
}

// GetActiveUserCount returns the number of users with active sessions within N seconds ago.
func (s *MattermostAuthLayer) GetActiveUserCount(updatedSecondsAgo int64) (int, error) {
	query := s.getQueryBuilder().
		Select("count(distinct userId)").
		From("Sessions").
		Where(sq.Gt{"LastActivityAt": utils.GetMillis() - utils.SecondsToMillis(updatedSecondsAgo)})

	row := query.QueryRow()

	var count int
	err := row.Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

func (s *MattermostAuthLayer) GetSession(token string, expireTime int64) (*model.Session, error) {
	return nil, NotSupportedError{"sessions not used when using mattermost"}
}

func (s *MattermostAuthLayer) CreateSession(session *model.Session) error {
	return NotSupportedError{"no update allowed from focalboard, update it using mattermost"}
}

func (s *MattermostAuthLayer) RefreshSession(session *model.Session) error {
	return NotSupportedError{"no update allowed from focalboard, update it using mattermost"}
}

func (s *MattermostAuthLayer) UpdateSession(session *model.Session) error {
	return NotSupportedError{"no update allowed from focalboard, update it using mattermost"}
}

func (s *MattermostAuthLayer) DeleteSession(sessionID string) error {
	return NotSupportedError{"no update allowed from focalboard, update it using mattermost"}
}

func (s *MattermostAuthLayer) CleanUpSessions(expireTime int64) error {
	return NotSupportedError{"no update allowed from focalboard, update it using mattermost"}
}

func (s *MattermostAuthLayer) GetWorkspace(id string) (*model.Workspace, error) {
	if id == "0" {
		workspace := model.Workspace{
			ID:    id,
			Title: "",
		}

		return &workspace, nil
	}

	query := s.getQueryBuilder().
		Select("DisplayName, Type").
		From("Channels").
		Where(sq.Eq{"ID": id})

	row := query.QueryRow()
	var displayName string
	var channelType string
	err := row.Scan(&displayName, &channelType)
	if err != nil {
		return nil, err
	}

	if channelType != "D" && channelType != "G" {
		return &model.Workspace{ID: id, Title: displayName}, nil
	}

	query = s.getQueryBuilder().
		Select("Username").
		From("ChannelMembers").
		Join("Users ON Users.ID=ChannelMembers.UserID").
		Where(sq.Eq{"ChannelID": id})

	var sb strings.Builder
	rows, err := query.Query()
	if err != nil {
		return nil, err
	}
	defer s.CloseRows(rows)

	first := true
	for rows.Next() {
		if first {
			first = false
		} else {
			sb.WriteString(", ")
		}
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		sb.WriteString(name)
	}
	return &model.Workspace{ID: id, Title: sb.String()}, nil
}

func (s *MattermostAuthLayer) HasWorkspaceAccess(userID string, workspaceID string) (bool, error) {
	query := s.getQueryBuilder().
		Select("count(*)").
		From("ChannelMembers").
		Where(sq.Eq{"ChannelID": workspaceID}).
		Where(sq.Eq{"UserID": userID})

	row := query.QueryRow()

	var count int
	err := row.Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func (s *MattermostAuthLayer) getQueryBuilder() sq.StatementBuilderType {
	builder := sq.StatementBuilder
	if s.dbType == postgresDBType || s.dbType == sqliteDBType {
		builder = builder.PlaceholderFormat(sq.Dollar)
	}

	return builder.RunWith(s.mmDB)
}

func (s *MattermostAuthLayer) GetUsersByWorkspace(workspaceID string) ([]*model.User, error) {
	query := s.getQueryBuilder().
		Select("id", "username", "props",
			"Users.CreateAt as create_at", "Users.UpdateAt as update_at", "Users.DeleteAt as delete_at", "b.UserId IS NOT NULL AS is_bot").
		From("Users").
		Join("ChannelMembers ON ChannelMembers.UserID = Users.ID").
		LeftJoin("Bots b ON ( b.UserId = Users.ID )").
		Where(sq.Eq{"Users.deleteAt": 0}).
		Where(sq.Eq{"ChannelMembers.ChannelId": workspaceID})

	rows, err := query.Query()
	if err != nil {
		return nil, err
	}
	defer s.CloseRows(rows)

	users, err := s.usersFromRows(rows)
	if err != nil {
		return nil, err
	}

	return users, nil
}

func (s *MattermostAuthLayer) usersFromRows(rows *sql.Rows) ([]*model.User, error) {
	users := []*model.User{}

	for rows.Next() {
		var user model.User
		var propsBytes []byte

		err := rows.Scan(
			&user.ID,
			&user.Username,
			&propsBytes,
			&user.CreateAt,
			&user.UpdateAt,
			&user.DeleteAt,
			&user.IsBot,
		)
		if err != nil {
			return nil, err
		}

		err = json.Unmarshal(propsBytes, &user.Props)
		if err != nil {
			return nil, err
		}

		users = append(users, &user)
	}

	return users, nil
}

func (s *MattermostAuthLayer) CloseRows(rows *sql.Rows) {
	if err := rows.Close(); err != nil {
		s.logger.Error("error closing MattermostAuthLayer row set", mlog.Err(err))
	}
}

func (s *MattermostAuthLayer) GetUserWorkspaces(userID string) ([]model.UserWorkspace, error) {
	var query sq.SelectBuilder

	var nonTemplateFilter string

	switch s.dbType {
	case mysqlDBType:
		nonTemplateFilter = "focalboard_blocks.fields LIKE '%\"isTemplate\":false%'"
	case postgresDBType:
		nonTemplateFilter = "focalboard_blocks.fields ->> 'isTemplate' = 'false'"
	default:
		return nil, fmt.Errorf("GetUserWorkspaces - %w", errUnsupportedDatabaseError)
	}

	query = s.getQueryBuilder().
		Select("Channels.ID", "Channels.DisplayName", "COUNT(focalboard_blocks.id), Channels.Type, Channels.Name").
		From("ChannelMembers").
		// select channels without a corresponding workspace
		LeftJoin(
			"focalboard_blocks ON focalboard_blocks.workspace_id = ChannelMembers.ChannelId AND "+
				"focalboard_blocks.type = 'board' AND "+
				nonTemplateFilter,
		).
		Join("Channels ON ChannelMembers.ChannelId = Channels.Id").
		Where(sq.Eq{"ChannelMembers.UserId": userID}).
		GroupBy("Channels.Id", "Channels.DisplayName")

	rows, err := query.Query()
	if err != nil {
		s.logger.Error("ERROR GetUserWorkspaces", mlog.Err(err))
		return nil, err
	}

	defer s.CloseRows(rows)
	return s.userWorkspacesFromRows(rows)
}

func (s *MattermostAuthLayer) GetUserWorkspacesInTeam(userID string, teamID string) ([]model.UserWorkspace, error) {
	var query sq.SelectBuilder

	var nonTemplateFilter string

	switch s.dbType {
	case mysqlDBType:
		nonTemplateFilter = nonTemplateFilterMySQL
	case postgresDBType:
		nonTemplateFilter = nonTemplateFilterPostgres
	default:
		return nil, fmt.Errorf("GetUserWorkspaces - %w", errUnsupportedDatabaseError)
	}

	query = s.getQueryBuilder().
		Select("Channels.ID", "Channels.DisplayName", "COUNT(focalboard_blocks.id)", "Channels.Type", "Channels.Name").
		From("ChannelMembers").
		// select channels without a corresponding workspace
		LeftJoin(
			"focalboard_blocks ON focalboard_blocks.workspace_id = ChannelMembers.ChannelId AND "+
				"focalboard_blocks.type = 'board' AND "+
				nonTemplateFilter,
		).
		Join("Channels ON ChannelMembers.ChannelId = Channels.Id").
		Where(sq.Eq{"ChannelMembers.UserId": userID}).
		Where(sq.Eq{"Channels.TeamID": teamID}).
		GroupBy("Channels.Id", "Channels.DisplayName")

	rows, err := query.Query()
	if err != nil {
		s.logger.Error("ERROR GetUserWorkspaces", mlog.Err(err))
		return nil, err
	}

	defer s.CloseRows(rows)

	accessibleWorkspaces, err := getPublicWorkspacesInTeam(teamID, s)
	if err != nil {
		s.logger.Error("ERROR getPublicWorkspacesInTeam", mlog.Err(err))
		return nil, err
	}
	memberWorkspaces, err := s.userWorkspacesFromRows(rows)
	if err != nil {
		s.logger.Error("ERROR userWorkspacesFromRows", mlog.Err(err))
		return nil, err
	}
	accessibleWorkspaces = append(accessibleWorkspaces, memberWorkspaces...)
	return accessibleWorkspaces, nil
}

func getPublicWorkspacesInTeam(teamID string, s *MattermostAuthLayer) ([]model.UserWorkspace, error) {
	var query sq.SelectBuilder

	var nonTemplateFilter string

	switch s.dbType {
	case mysqlDBType:
		nonTemplateFilter = nonTemplateFilterMySQL
	case postgresDBType:
		nonTemplateFilter = nonTemplateFilterPostgres
	default:
		return nil, fmt.Errorf("GetUserWorkspaces - %w", errUnsupportedDatabaseError)
	}

	query = s.getQueryBuilder().
		Select("pc.ID", "pc.DisplayName", "COUNT(focalboard_blocks.id)", "'O' as Type", "pc.Name").
		From("PublicChannels as pc").
		// select channels without a corresponding workspace
		LeftJoin(
			"focalboard_blocks ON focalboard_blocks.workspace_id = pc.ID AND "+
				"focalboard_blocks.type = 'board' AND "+
				nonTemplateFilter,
		).
		Where(sq.Eq{"pc.TeamID": teamID}).
		GroupBy("pc.Id", "pc.DisplayName")

	rows, err := query.Query()
	if err != nil {
		s.logger.Error("ERROR GetUserWorkspaces", mlog.Err(err))
		return nil, err
	}

	defer s.CloseRows(rows)
	return s.userWorkspacesFromRows(rows)
}

type UserWorkspaceRawModel struct {
	ID         string `json:"id"`
	Title      string `json:"title"`
	BoardCount int    `json:"boardCount"`
	Type       string `json:"type"`
	Name       string `json:"name"`
}

func (s *MattermostAuthLayer) userWorkspacesFromRows(rows *sql.Rows) ([]model.UserWorkspace, error) {
	rawUserWorkspaces := []UserWorkspaceRawModel{}
	usersToFetch := []string{}

	for rows.Next() {
		var rawUserWorkspace UserWorkspaceRawModel

		err := rows.Scan(
			&rawUserWorkspace.ID,
			&rawUserWorkspace.Title,
			&rawUserWorkspace.BoardCount,
			&rawUserWorkspace.Type,
			&rawUserWorkspace.Name,
		)

		if err != nil {
			s.logger.Error("ERROR userWorkspacesFromRows", mlog.Err(err))
			return nil, err
		}

		if rawUserWorkspace.Type == directChannelType {
			userIDs := strings.Split(rawUserWorkspace.Name, "__")
			usersToFetch = append(usersToFetch, userIDs...)
		}

		rawUserWorkspaces = append(rawUserWorkspaces, rawUserWorkspace)
	}

	var users map[string]*model.User

	if len(usersToFetch) > 0 {
		var err error
		users, err = s.getUsersByCondition(sq.Eq{"id": usersToFetch})
		if err != nil {
			return nil, err
		}
	}

	userWorkspaces := []model.UserWorkspace{}

	for i := range rawUserWorkspaces {
		if rawUserWorkspaces[i].Type == directChannelType {
			userIDs := strings.Split(rawUserWorkspaces[i].Name, "__")
			names := []string{}

			for _, userID := range userIDs {
				user, exists := users[userID]
				// Shows "(Deleted User)" instead of long, unreadable UUID in case the user is not found
				username := "(Deleted User)"
				if exists {
					username = user.Username
				}

				names = append(names, username)
			}

			rawUserWorkspaces[i].Title = strings.Join(names, ", ")
		}

		userWorkspace := model.UserWorkspace{
			ID:         rawUserWorkspaces[i].ID,
			Title:      rawUserWorkspaces[i].Title,
			BoardCount: rawUserWorkspaces[i].BoardCount,
		}

		userWorkspaces = append(userWorkspaces, userWorkspace)
	}

	return userWorkspaces, nil
}

func (s *MattermostAuthLayer) CreatePrivateWorkspace(userID string) (string, error) {
	// we emulate a private workspace by creating
	// a DM channel from the user to themselves.
	channel, err := s.pluginAPI.GetDirectChannel(userID, userID)
	if err != nil {
		s.logger.Error("error fetching private workspace", mlog.String("userID", userID), mlog.Err(err))
		return "", err
	}

	return channel.Id, nil
}

func (s *MattermostAuthLayer) getSystemBotID() (string, error) {
	botID, err := s.client.Bot.EnsureBot(systemsBot)
	if err != nil {
		s.logger.Error("failed to ensure system bot", mlog.String("username", systemsBot.Username), mlog.Err(err))
		return "", err
	}

	return botID, nil
}

func (s *MattermostAuthLayer) SendMessage(message, postType string, receipts []string) error {
	botID, err := s.getSystemBotID()
	if err != nil {
		return err
	}

	for _, receipt := range receipts {
		channel, err := s.pluginAPI.GetDirectChannel(botID, receipt)
		if err != nil {
			s.logger.Error(
				"failed to get DM channel between system bot and user for receipt",
				mlog.String("receipt", receipt),
				mlog.String("user_id", receipt),
				mlog.Err(err),
			)
			continue
		}

		post := &mmModel.Post{
			Message:   message,
			UserId:    botID,
			ChannelId: channel.Id,
			Type:      postType,
		}

		if _, err := s.pluginAPI.CreatePost(post); err != nil {
			s.logger.Error(
				"failed to send message to receipt from SendMessage",
				mlog.String("receipt", receipt),
				mlog.Err(err),
			)
			continue
		}
	}

	return nil
}

func (s *MattermostAuthLayer) GetWorkspaceTeam(workspaceID string) (*mmModel.Team, error) {
	channel, err := s.pluginAPI.GetChannel(workspaceID)
	if err != nil {
		s.logger.Error("failed to fetch channel", mlog.String("workspace_id", workspaceID), mlog.Err(errors.New(err.Error())))
		return nil, errors.New(err.Error())
	}

	if channel.Type == mmModel.ChannelTypeDirect || channel.Type == mmModel.ChannelTypeGroup {
		return nil, nil
	}

	team, err := s.pluginAPI.GetTeam(channel.TeamId)
	if err != nil {
		s.logger.Error(
			"failed to fetch team",
			mlog.String("team_id", channel.TeamId),
			mlog.String("channel_id", workspaceID),
			mlog.Err(errors.New(err.Error())),
		)
		return nil, errors.New(err.Error())
	}

	return team, nil
}

func (s *MattermostAuthLayer) GetFileInfo(id string) (*mmModel.FileInfo, error) {
	fileInfo, appErr := s.pluginAPI.GetFileInfo(id)
	if appErr != nil {
		// Not finding fileinfo is fine because we don't have data for
		// any existing files already uploaded in Boards before this code
		// was deployed.
		if appErr.StatusCode == http.StatusNotFound {
			return nil, nil
		}

		s.logger.Error("error fetching fileinfo", mlog.String("id", id), mlog.Err(appErr))
		return nil, appErr
	}

	return fileInfo, nil
}

func (s *MattermostAuthLayer) SaveFileInfo(fileInfo *mmModel.FileInfo) error {
	query := s.getQueryBuilder().
		Insert("FileInfo").
		Columns(
			"Id",
			"CreatorId",
			"PostId",
			"CreateAt",
			"UpdateAt",
			"DeleteAt",
			"Path",
			"ThumbnailPath",
			"PreviewPath",
			"Name",
			"Extension",
			"Size",
			"MimeType",
			"Width",
			"Height",
			"HasPreviewImage",
			"MiniPreview",
			"Content",
			"RemoteId",
			"Archived",
		).
		Values(
			fileInfo.Id,
			fileInfo.CreatorId,
			fileInfo.PostId,
			fileInfo.CreateAt,
			fileInfo.UpdateAt,
			fileInfo.DeleteAt,
			fileInfo.Path,
			fileInfo.ThumbnailPath,
			fileInfo.PreviewPath,
			fileInfo.Name,
			fileInfo.Extension,
			fileInfo.Size,
			fileInfo.MimeType,
			fileInfo.Width,
			fileInfo.Height,
			fileInfo.HasPreviewImage,
			fileInfo.MiniPreview,
			fileInfo.Content,
			fileInfo.RemoteId,
			false,
		)

	if _, err := query.Exec(); err != nil {
		s.logger.Error(
			"failed to save fileinfo",
			mlog.String("file_name", fileInfo.Name),
			mlog.Int64("size", fileInfo.Size),
			mlog.Err(err),
		)
		return err
	}

	return nil
}

func (s *MattermostAuthLayer) GetLicense() *mmModel.License {
	return s.pluginAPI.GetLicense()
}

func (s *MattermostAuthLayer) HasPermissionToTeam(userID string, teamID string) bool {
	return s.pluginAPI.HasPermissionToTeam(userID, teamID, mmModel.PermissionViewTeam)
}

func (s *MattermostAuthLayer) GetCloudLimits() (*mmModel.ProductLimits, error) {
	return s.pluginAPI.GetCloudLimits()
}

func (s *MattermostAuthLayer) IsUserGuest(userID string) (bool, error) {
	user, err := s.GetUserByID(userID)
	if err != nil {
		return false, err
	}
	return strings.Contains(user.Roles, "guest"), nil
}
