package mattermostauthlayer

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

	pluginapi "github.com/mattermost/mattermost-plugin-api"

	mmModel "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/plugin"

	sq "github.com/Masterminds/squirrel"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

var systemsBot = &mmModel.Bot{
	Username:    mmModel.BotSystemBotUsername,
	DisplayName: "System",
}

type NotSupportedError struct {
	msg string
}

func (pe NotSupportedError) Error() string {
	return pe.msg
}

// Store represents the abstraction of the data storage.
type MattermostAuthLayer struct {
	store.Store
	dbType      string
	mmDB        *sql.DB
	logger      *mlog.Logger
	pluginAPI   plugin.API
	tablePrefix string
	client      *pluginapi.Client
}

// New creates a new SQL implementation of the store.
func New(
	dbType string,
	db *sql.DB,
	store store.Store,
	logger *mlog.Logger,
	pluginAPI plugin.API,
	tablePrefix string,
	client *pluginapi.Client,
) (*MattermostAuthLayer, error) {
	layer := &MattermostAuthLayer{
		Store:       store,
		dbType:      dbType,
		mmDB:        db,
		logger:      logger,
		pluginAPI:   pluginAPI,
		tablePrefix: tablePrefix,
		client:      client,
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
		Where(sq.Eq{"deleteAt": 0}).
		Where(sq.NotEq{"roles": "system_guest"})
	row := query.QueryRow()

	var count int
	err := row.Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

func (s *MattermostAuthLayer) GetUserByID(userID string) (*model.User, error) {
	mmuser, err := s.pluginAPI.GetUser(userID)
	if err != nil {
		return nil, err
	}
	user := mmUserToFbUser(mmuser)
	return &user, nil
}

func (s *MattermostAuthLayer) GetUserByEmail(email string) (*model.User, error) {
	mmuser, err := s.pluginAPI.GetUserByEmail(email)
	if err != nil {
		return nil, err
	}
	user := mmUserToFbUser(mmuser)
	return &user, nil
}

func (s *MattermostAuthLayer) GetUserByUsername(username string) (*model.User, error) {
	mmuser, err := s.pluginAPI.GetUserByUsername(username)
	if err != nil {
		return nil, err
	}
	user := mmUserToFbUser(mmuser)
	return &user, nil
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

func (s *MattermostAuthLayer) GetTeam(id string) (*model.Team, error) {
	if id == "0" {
		team := model.Team{
			ID:    id,
			Title: "",
		}

		return &team, nil
	}

	query := s.getQueryBuilder().
		Select("DisplayName").
		From("Teams").
		Where(sq.Eq{"ID": id})

	row := query.QueryRow()
	var displayName string
	err := row.Scan(&displayName)
	if err != nil && !model.IsErrNotFound(err) {
		s.logger.Error("GetTeam scan error",
			mlog.String("team_id", id),
			mlog.Err(err),
		)
		return nil, err
	}

	return &model.Team{ID: id, Title: displayName}, nil
}

// GetTeamsForUser retrieves all the teams that the user is a member of.
func (s *MattermostAuthLayer) GetTeamsForUser(userID string) ([]*model.Team, error) {
	query := s.getQueryBuilder().
		Select("t.Id", "t.DisplayName").
		From("Teams as t").
		Join("TeamMembers as tm on t.Id=tm.TeamId").
		Where(sq.Eq{"tm.UserId": userID}).
		Where(sq.Eq{"tm.DeleteAt": 0})

	rows, err := query.Query()
	if err != nil {
		return nil, err
	}
	defer s.CloseRows(rows)

	teams := []*model.Team{}
	for rows.Next() {
		var team model.Team

		err := rows.Scan(
			&team.ID,
			&team.Title,
		)
		if err != nil {
			return nil, err
		}

		teams = append(teams, &team)
	}

	return teams, nil
}

func (s *MattermostAuthLayer) getQueryBuilder() sq.StatementBuilderType {
	builder := sq.StatementBuilder
	if s.dbType == model.PostgresDBType || s.dbType == model.SqliteDBType {
		builder = builder.PlaceholderFormat(sq.Dollar)
	}

	return builder.RunWith(s.mmDB)
}

func (s *MattermostAuthLayer) GetUsersByTeam(teamID string) ([]*model.User, error) {
	query := s.getQueryBuilder().
		Select("u.id", "u.username", "u.props", "u.CreateAt as create_at", "u.UpdateAt as update_at",
			"u.DeleteAt as delete_at", "b.UserId IS NOT NULL AS is_bot").
		From("Users as u").
		Join("TeamMembers as tm ON tm.UserID = u.ID").
		LeftJoin("Bots b ON ( b.UserId = Users.ID )").
		Where(sq.Eq{"u.deleteAt": 0}).
		Where(sq.NotEq{"u.roles": "system_guest"}).
		Where(sq.Eq{"tm.TeamId": teamID})

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

func (s *MattermostAuthLayer) SearchUsersByTeam(teamID string, searchQuery string) ([]*model.User, error) {
	query := s.getQueryBuilder().
		Select("u.id", "u.username", "u.props", "u.CreateAt as create_at", "u.UpdateAt as update_at",
			"u.DeleteAt as delete_at", "b.UserId IS NOT NULL AS is_bot").
		From("Users as u").
		Join("TeamMembers as tm ON tm.UserID = u.id").
		LeftJoin("Bots b ON ( b.UserId = u.id )").
		Where(sq.Eq{"u.deleteAt": 0}).
		Where(sq.Or{
			sq.Like{"u.username": "%" + searchQuery + "%"},
			sq.Like{"u.nickname": "%" + searchQuery + "%"},
			sq.Like{"u.firstname": "%" + searchQuery + "%"},
			sq.Like{"u.lastname": "%" + searchQuery + "%"},
		}).
		Where(sq.Eq{"tm.TeamId": teamID}).
		Where(sq.NotEq{"u.roles": "system_guest"}).
		OrderBy("u.username").
		Limit(10)

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

func mmUserToFbUser(mmUser *mmModel.User) model.User {
	props := map[string]interface{}{}
	for key, value := range mmUser.Props {
		props[key] = value
	}
	authData := ""
	if mmUser.AuthData != nil {
		authData = *mmUser.AuthData
	}
	return model.User{
		ID:          mmUser.Id,
		Username:    mmUser.Username,
		Email:       mmUser.Email,
		Password:    mmUser.Password,
		MfaSecret:   mmUser.MfaSecret,
		AuthService: mmUser.AuthService,
		AuthData:    authData,
		Props:       props,
		CreateAt:    mmUser.CreateAt,
		UpdateAt:    mmUser.UpdateAt,
		DeleteAt:    mmUser.DeleteAt,
		IsBot:       mmUser.IsBot,
		IsGuest:     mmUser.IsGuest(),
		Roles:       mmUser.Roles,
	}
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

func boardFields(prefix string) []string {
	fields := []string{
		"id",
		"team_id",
		"COALESCE(channel_id, '')",
		"COALESCE(created_by, '')",
		"modified_by",
		"type",
		"title",
		"description",
		"icon",
		"show_description",
		"is_template",
		"template_version",
		"COALESCE(properties, '{}')",
		"COALESCE(card_properties, '[]')",
		"create_at",
		"update_at",
		"delete_at",
	}

	if prefix == "" {
		return fields
	}

	prefixedFields := make([]string, len(fields))
	for i, field := range fields {
		if strings.HasPrefix(field, "COALESCE(") {
			prefixedFields[i] = strings.Replace(field, "COALESCE(", "COALESCE("+prefix, 1)
		} else {
			prefixedFields[i] = prefix + field
		}
	}
	return prefixedFields
}

// SearchBoardsForUser returns all boards that match with the
// term that are either private and which the user is a member of, or
// they're open, regardless of the user membership.
// Search is case-insensitive.
func (s *MattermostAuthLayer) SearchBoardsForUser(term, userID string) ([]*model.Board, error) {
	query := s.getQueryBuilder().
		Select(boardFields("b.")...).
		Distinct().
		From(s.tablePrefix + "boards as b").
		LeftJoin(s.tablePrefix + "board_members as bm on b.id=bm.board_id").
		LeftJoin("TeamMembers as tm on tm.teamid=b.team_id").
		Where(sq.Eq{"b.is_template": false}).
		Where(sq.Eq{"tm.userID": userID}).
		Where(sq.Eq{"tm.deleteAt": 0}).
		Where(sq.Or{
			sq.Eq{"b.type": model.BoardTypeOpen},
			sq.And{
				sq.Eq{"b.type": model.BoardTypePrivate},
				sq.Eq{"bm.user_id": userID},
			},
		})

	if term != "" {
		// break search query into space separated words
		// and search for each word.
		// This should later be upgraded to industrial-strength
		// word tokenizer, that uses much more than space
		// to break words.

		conditions := sq.Or{}

		for _, word := range strings.Split(strings.TrimSpace(term), " ") {
			conditions = append(conditions, sq.Like{"lower(b.title)": "%" + strings.ToLower(word) + "%"})
		}

		query = query.Where(conditions)
	}

	rows, err := query.Query()
	if err != nil {
		s.logger.Error(`searchBoardsForUser ERROR`, mlog.Err(err))
		return nil, err
	}
	defer s.CloseRows(rows)

	return s.boardsFromRows(rows)
}

func (s *MattermostAuthLayer) boardsFromRows(rows *sql.Rows) ([]*model.Board, error) {
	boards := []*model.Board{}

	for rows.Next() {
		var board model.Board
		var propertiesBytes []byte
		var cardPropertiesBytes []byte

		err := rows.Scan(
			&board.ID,
			&board.TeamID,
			&board.ChannelID,
			&board.CreatedBy,
			&board.ModifiedBy,
			&board.Type,
			&board.Title,
			&board.Description,
			&board.Icon,
			&board.ShowDescription,
			&board.IsTemplate,
			&board.TemplateVersion,
			&propertiesBytes,
			&cardPropertiesBytes,
			&board.CreateAt,
			&board.UpdateAt,
			&board.DeleteAt,
		)
		if err != nil {
			s.logger.Error("boardsFromRows scan error", mlog.Err(err))
			return nil, err
		}

		err = json.Unmarshal(propertiesBytes, &board.Properties)
		if err != nil {
			s.logger.Error("board properties unmarshal error", mlog.Err(err))
			return nil, err
		}
		err = json.Unmarshal(cardPropertiesBytes, &board.CardProperties)
		if err != nil {
			s.logger.Error("board card properties unmarshal error", mlog.Err(err))
			return nil, err
		}

		boards = append(boards, &board)
	}

	return boards, nil
}

func (s *MattermostAuthLayer) GetCloudLimits() (*mmModel.ProductLimits, error) {
	return s.pluginAPI.GetCloudLimits()
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
