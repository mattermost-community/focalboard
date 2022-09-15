package mattermostauthlayer

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"

	mmModel "github.com/mattermost/mattermost-server/v6/model"

	sq "github.com/Masterminds/squirrel"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

var boardsBotID string

// servicesAPI is the interface required my the MattermostAuthLayer to interact with
// the mattermost-server. You can use plugin-api or product-api adapter implementations.
type servicesAPI interface {
	GetDirectChannel(userID1, userID2 string) (*mmModel.Channel, error)
	GetChannelByID(channelID string) (*mmModel.Channel, error)
	GetChannelMember(channelID string, userID string) (*mmModel.ChannelMember, error)
	GetChannelsForTeamForUser(teamID string, userID string, includeDeleted bool) (mmModel.ChannelList, error)
	GetUserByID(userID string) (*mmModel.User, error)
	UpdateUser(user *mmModel.User) (*mmModel.User, error)
	GetUserByEmail(email string) (*mmModel.User, error)
	GetUserByUsername(username string) (*mmModel.User, error)
	GetLicense() *mmModel.License
	GetFileInfo(fileID string) (*mmModel.FileInfo, error)
	GetCloudLimits() (*mmModel.ProductLimits, error)
	EnsureBot(bot *mmModel.Bot) (string, error)
	CreatePost(post *mmModel.Post) (*mmModel.Post, error)
	GetTeamMember(teamID string, userID string) (*mmModel.TeamMember, error)
	GetPreferencesForUser(userID string) (mmModel.Preferences, error)
	DeletePreferencesForUser(userID string, preferences mmModel.Preferences) error
	UpdatePreferencesForUser(userID string, preferences mmModel.Preferences) error
}

// Store represents the abstraction of the data storage.
type MattermostAuthLayer struct {
	store.Store
	dbType      string
	mmDB        *sql.DB
	logger      mlog.LoggerIFace
	servicesAPI servicesAPI
	tablePrefix string
}

// New creates a new SQL implementation of the store.
func New(dbType string, db *sql.DB, store store.Store, logger mlog.LoggerIFace, api servicesAPI, tablePrefix string) (*MattermostAuthLayer, error) {
	layer := &MattermostAuthLayer{
		Store:       store,
		dbType:      dbType,
		mmDB:        db,
		logger:      logger,
		servicesAPI: api,
		tablePrefix: tablePrefix,
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

func (s *MattermostAuthLayer) GetUserByID(userID string) (*model.User, error) {
	mmuser, err := s.servicesAPI.GetUserByID(userID)
	if err != nil {
		return nil, err
	}
	user := mmUserToFbUser(mmuser)
	return &user, nil
}

func (s *MattermostAuthLayer) GetUserByEmail(email string) (*model.User, error) {
	mmuser, err := s.servicesAPI.GetUserByEmail(email)
	if err != nil {
		return nil, err
	}
	user := mmUserToFbUser(mmuser)
	return &user, nil
}

func (s *MattermostAuthLayer) GetUserByUsername(username string) (*model.User, error) {
	mmuser, err := s.servicesAPI.GetUserByUsername(username)
	if err != nil {
		return nil, err
	}
	user := mmUserToFbUser(mmuser)
	return &user, nil
}

func (s *MattermostAuthLayer) CreateUser(user *model.User) error {
	return store.NewNotSupportedError("no user creation allowed from focalboard, create it using mattermost")
}

func (s *MattermostAuthLayer) UpdateUser(user *model.User) error {
	return store.NewNotSupportedError("no update allowed from focalboard, update it using mattermost")
}

func (s *MattermostAuthLayer) UpdateUserPassword(username, password string) error {
	return store.NewNotSupportedError("no update allowed from focalboard, update it using mattermost")
}

func (s *MattermostAuthLayer) UpdateUserPasswordByID(userID, password string) error {
	return store.NewNotSupportedError("no update allowed from focalboard, update it using mattermost")
}

func (s *MattermostAuthLayer) PatchUserProps(userID string, patch model.UserPropPatch) error {
	if len(patch.UpdatedFields) > 0 {
		updatedPreferences := mmModel.Preferences{}
		for key, value := range patch.UpdatedFields {
			preference := mmModel.Preference{
				UserId:   userID,
				Category: model.PreferencesCategoryFocalboard,
				Name:     key,
				Value:    value,
			}

			updatedPreferences = append(updatedPreferences, preference)
		}

		if err := s.servicesAPI.UpdatePreferencesForUser(userID, updatedPreferences); err != nil {
			s.logger.Error("failed to update user preferences", mlog.String("user_id", userID), mlog.Err(err))
			return err
		}
	}

	if len(patch.DeletedFields) > 0 {
		deletedPreferences := mmModel.Preferences{}
		for _, key := range patch.DeletedFields {
			preference := mmModel.Preference{
				UserId:   userID,
				Category: model.PreferencesCategoryFocalboard,
				Name:     key,
			}

			deletedPreferences = append(deletedPreferences, preference)
		}

		if err := s.servicesAPI.DeletePreferencesForUser(userID, deletedPreferences); err != nil {
			s.logger.Error("failed to delete user preferences", mlog.String("user_id", userID), mlog.Err(err))
			return err
		}
	}

	return nil
}

func (s *MattermostAuthLayer) GetUserPreferences(userID string) (mmModel.Preferences, error) {
	return s.servicesAPI.GetPreferencesForUser(userID)
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
	return nil, store.NewNotSupportedError("sessions not used when using mattermost")
}

func (s *MattermostAuthLayer) CreateSession(session *model.Session) error {
	return store.NewNotSupportedError("no update allowed from focalboard, update it using mattermost")
}

func (s *MattermostAuthLayer) RefreshSession(session *model.Session) error {
	return store.NewNotSupportedError("no update allowed from focalboard, update it using mattermost")
}

func (s *MattermostAuthLayer) UpdateSession(session *model.Session) error {
	return store.NewNotSupportedError("no update allowed from focalboard, update it using mattermost")
}

func (s *MattermostAuthLayer) DeleteSession(sessionID string) error {
	return store.NewNotSupportedError("no update allowed from focalboard, update it using mattermost")
}

func (s *MattermostAuthLayer) CleanUpSessions(expireTime int64) error {
	return store.NewNotSupportedError("no update allowed from focalboard, update it using mattermost")
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

func (s *MattermostAuthLayer) GetUsersByTeam(teamID string, asGuestID string) ([]*model.User, error) {
	query := s.getQueryBuilder().
		Select("u.id", "u.username", "u.email", "u.nickname", "u.firstname", "u.lastname", "u.props", "u.CreateAt as create_at", "u.UpdateAt as update_at",
			"u.DeleteAt as delete_at", "b.UserId IS NOT NULL AS is_bot, u.roles = 'system_guest' as is_guest").
		From("Users as u").
		LeftJoin("Bots b ON ( b.UserID = u.id )").
		Where(sq.Eq{"u.deleteAt": 0})

	if asGuestID == "" {
		query = query.
			Join("TeamMembers as tm ON tm.UserID = u.id").
			Where(sq.Eq{"tm.TeamId": teamID})
	} else {
		boards, err := s.GetBoardsForUserAndTeam(asGuestID, teamID, false)
		if err != nil {
			return nil, err
		}

		boardsIDs := []string{}
		for _, board := range boards {
			boardsIDs = append(boardsIDs, board.ID)
		}
		query = query.
			Join(s.tablePrefix + "board_members as bm ON bm.UserID = u.ID").
			Where(sq.Eq{"bm.BoardId": boardsIDs})
	}

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

func (s *MattermostAuthLayer) GetUsersList(userIDs []string) ([]*model.User, error) {
	query := s.getQueryBuilder().
		Select("u.id", "u.username", "u.email", "u.nickname", "u.firstname", "u.lastname", "u.props", "u.CreateAt as create_at", "u.UpdateAt as update_at",
			"u.DeleteAt as delete_at", "b.UserId IS NOT NULL AS is_bot, u.roles = 'system_guest' as is_guest").
		From("Users as u").
		LeftJoin("Bots b ON ( b.UserId = u.id )").
		Where(sq.Eq{"u.id": userIDs})

	rows, err := query.Query()
	if err != nil {
		return nil, err
	}
	defer s.CloseRows(rows)

	users, err := s.usersFromRows(rows)
	if err != nil {
		return nil, err
	}

	if len(users) != len(userIDs) {
		return users, model.NewErrNotAllFound("user", userIDs)
	}

	return users, nil
}

func (s *MattermostAuthLayer) SearchUsersByTeam(teamID string, searchQuery string, asGuestID string, excludeBots bool) ([]*model.User, error) {
	query := s.getQueryBuilder().
		Select("u.id", "u.username", "u.email", "u.nickname", "u.firstname", "u.lastname", "u.props", "u.CreateAt as create_at", "u.UpdateAt as update_at",
			"u.DeleteAt as delete_at", "b.UserId IS NOT NULL AS is_bot, u.roles = 'system_guest' as is_guest").
		From("Users as u").
		LeftJoin("Bots b ON ( b.UserId = u.id )").
		Where(sq.Eq{"u.deleteAt": 0}).
		Where(sq.Or{
			sq.Like{"u.username": "%" + searchQuery + "%"},
			sq.Like{"u.nickname": "%" + searchQuery + "%"},
			sq.Like{"u.firstname": "%" + searchQuery + "%"},
			sq.Like{"u.lastname": "%" + searchQuery + "%"},
		}).
		OrderBy("u.username").
		Limit(10)

	if excludeBots {
		query = query.
			Where(sq.Eq{"b.UserId IS NOT NULL": false})
	}

	if asGuestID == "" {
		query = query.
			Join("TeamMembers as tm ON tm.UserID = u.id").
			Where(sq.Eq{"tm.TeamId": teamID})
	} else {
		boards, err := s.GetBoardsForUserAndTeam(asGuestID, teamID, false)
		if err != nil {
			return nil, err
		}
		boardsIDs := []string{}
		for _, board := range boards {
			boardsIDs = append(boardsIDs, board.ID)
		}
		query = query.
			Join(s.tablePrefix + "board_members as bm ON bm.user_id = u.ID").
			Where(sq.Eq{"bm.board_id": boardsIDs})
	}

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
			&user.Email,
			&user.Nickname,
			&user.FirstName,
			&user.LastName,
			&propsBytes,
			&user.CreateAt,
			&user.UpdateAt,
			&user.DeleteAt,
			&user.IsBot,
			&user.IsGuest,
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
	channel, err := s.servicesAPI.GetDirectChannel(userID, userID)
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
		Nickname:    mmUser.Nickname,
		FirstName:   mmUser.FirstName,
		LastName:    mmUser.LastName,
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
	fileInfo, err := s.servicesAPI.GetFileInfo(id)
	if err != nil {
		// Not finding fileinfo is fine because we don't have data for
		// any existing files already uploaded in Boards before this code
		// was deployed.
		var appErr *mmModel.AppError
		if errors.As(err, &appErr) {
			if appErr.StatusCode == http.StatusNotFound {
				return nil, model.NewErrNotFound("file info ID=" + id)
			}
		}

		s.logger.Error("error fetching fileinfo",
			mlog.String("id", id),
			mlog.Err(err),
		)
		return nil, err
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
	return s.servicesAPI.GetLicense()
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
func (s *MattermostAuthLayer) SearchBoardsForUser(term, userID string, includePublicBoards bool) ([]*model.Board, error) {
	query := s.getQueryBuilder().
		Select(boardFields("b.")...).
		Distinct().
		From(s.tablePrefix + "boards as b").
		LeftJoin(s.tablePrefix + "board_members as bm on b.id=bm.board_id").
		LeftJoin("TeamMembers as tm on tm.teamid=b.team_id").
		LeftJoin("ChannelMembers as cm on cm.channelId=b.channel_id").
		Where(sq.Eq{"b.is_template": false}).
		Where(sq.Eq{"tm.userID": userID}).
		Where(sq.Eq{"tm.deleteAt": 0})

	if includePublicBoards {
		query = query.Where(sq.Or{
			sq.Eq{"b.type": model.BoardTypeOpen},
			sq.Eq{"bm.user_id": userID},
			sq.Eq{"cm.userId": userID},
		})
	} else {
		query = query.Where(sq.Or{
			sq.Eq{"bm.user_id": userID},
			sq.Eq{"cm.userId": userID},
		})
	}

	if term != "" {
		// break search query into space separated words
		// and search for all words.
		// This should later be upgraded to industrial-strength
		// word tokenizer, that uses much more than space
		// to break words.

		conditions := sq.And{}

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
	return s.servicesAPI.GetCloudLimits()
}

func (s *MattermostAuthLayer) implicitBoardMembershipsFromRows(rows *sql.Rows) ([]*model.BoardMember, error) {
	boardMembers := []*model.BoardMember{}

	for rows.Next() {
		var boardMember model.BoardMember

		err := rows.Scan(
			&boardMember.UserID,
			&boardMember.BoardID,
		)
		if err != nil {
			return nil, err
		}
		boardMember.Roles = "editor"
		boardMember.SchemeEditor = true
		boardMember.Synthetic = true

		boardMembers = append(boardMembers, &boardMember)
	}

	return boardMembers, nil
}

func (s *MattermostAuthLayer) GetMemberForBoard(boardID, userID string) (*model.BoardMember, error) {
	bm, err := s.Store.GetMemberForBoard(boardID, userID)
	if model.IsErrNotFound(err) {
		b, boardErr := s.Store.GetBoard(boardID)
		if boardErr != nil {
			return nil, boardErr
		}
		if b.ChannelID != "" {
			_, memberErr := s.servicesAPI.GetChannelMember(b.ChannelID, userID)
			if memberErr != nil {
				var appErr *mmModel.AppError
				if errors.As(memberErr, &appErr) && appErr.StatusCode == http.StatusNotFound {
					// Plugin API returns error if channel member doesn't exist.
					// We're fine if it doesn't exist, so its not an error for us.
					message := fmt.Sprintf("member BoardID=%s UserID=%s", boardID, userID)
					return nil, model.NewErrNotFound(message)
				}

				return nil, memberErr
			}

			return &model.BoardMember{
				BoardID:         boardID,
				UserID:          userID,
				Roles:           "editor",
				SchemeAdmin:     false,
				SchemeEditor:    true,
				SchemeCommenter: false,
				SchemeViewer:    false,
				Synthetic:       true,
			}, nil
		}
		if b.Type == model.BoardTypeOpen && b.IsTemplate {
			_, memberErr := s.servicesAPI.GetTeamMember(b.TeamID, userID)
			if memberErr != nil {
				var appErr *mmModel.AppError
				if errors.As(memberErr, &appErr) && appErr.StatusCode == http.StatusNotFound {
					return nil, model.NewErrNotFound(userID)
				}
				return nil, memberErr
			}

			return &model.BoardMember{
				BoardID:         boardID,
				UserID:          userID,
				Roles:           "viewer",
				SchemeAdmin:     false,
				SchemeEditor:    false,
				SchemeCommenter: false,
				SchemeViewer:    true,
				Synthetic:       true,
			}, nil
		}
	}
	if err != nil {
		return nil, err
	}
	return bm, nil
}

func (s *MattermostAuthLayer) GetMembersForUser(userID string) ([]*model.BoardMember, error) {
	explicitMembers, err := s.Store.GetMembersForUser(userID)
	if err != nil {
		s.logger.Error(`getMembersForUser ERROR`, mlog.Err(err))
		return nil, err
	}

	query := s.getQueryBuilder().
		Select("CM.userID, B.Id").
		From(s.tablePrefix + "boards AS B").
		Join("ChannelMembers AS CM ON B.channel_id=CM.channelId").
		Where(sq.Eq{"CM.userID": userID})

	rows, err := query.Query()
	if err != nil {
		s.logger.Error(`getMembersForUser ERROR`, mlog.Err(err))
		return nil, err
	}
	defer s.CloseRows(rows)

	implicitMembers, err := s.implicitBoardMembershipsFromRows(rows)
	if err != nil {
		return nil, err
	}
	members := []*model.BoardMember{}
	existingMembers := map[string]bool{}
	for _, m := range explicitMembers {
		members = append(members, m)
		existingMembers[m.BoardID] = true
	}
	for _, m := range implicitMembers {
		if !existingMembers[m.BoardID] {
			members = append(members, m)
		}
	}

	return members, nil
}

func (s *MattermostAuthLayer) GetMembersForBoard(boardID string) ([]*model.BoardMember, error) {
	explicitMembers, err := s.Store.GetMembersForBoard(boardID)
	if err != nil {
		s.logger.Error(`getMembersForBoard ERROR`, mlog.Err(err))
		return nil, err
	}

	query := s.getQueryBuilder().
		Select("CM.userID, B.Id").
		From(s.tablePrefix + "boards AS B").
		Join("ChannelMembers AS CM ON B.channel_id=CM.channelId").
		Where(sq.Eq{"B.id": boardID}).
		Where(sq.NotEq{"B.channel_id": ""})

	rows, err := query.Query()
	if err != nil {
		s.logger.Error(`getMembersForBoard ERROR`, mlog.Err(err))
		return nil, err
	}
	defer s.CloseRows(rows)

	implicitMembers, err := s.implicitBoardMembershipsFromRows(rows)
	if err != nil {
		return nil, err
	}
	members := []*model.BoardMember{}
	existingMembers := map[string]bool{}
	for _, m := range explicitMembers {
		members = append(members, m)
		existingMembers[m.UserID] = true
	}
	for _, m := range implicitMembers {
		if !existingMembers[m.UserID] {
			members = append(members, m)
		}
	}

	return members, nil
}

func (s *MattermostAuthLayer) GetBoardsForUserAndTeam(userID, teamID string, includePublicBoards bool) ([]*model.Board, error) {
	members, err := s.GetMembersForUser(userID)
	if err != nil {
		return nil, err
	}

	boardIDs := []string{}
	for _, m := range members {
		boardIDs = append(boardIDs, m.BoardID)
	}

	if includePublicBoards {
		var boards []*model.Board
		boards, err = s.SearchBoardsForUserInTeam(teamID, "", userID)
		if err != nil {
			return nil, err
		}
		for _, b := range boards {
			boardIDs = append(boardIDs, b.ID)
		}
	}

	boards, err := s.Store.GetBoardsInTeamByIds(boardIDs, teamID)
	// ToDo: check if the query is being used appropriately from the
	//       interface, as we're getting ID sets on request that
	//       return partial results that seem to be valid
	if model.IsErrNotFound(err) {
		if boards == nil {
			boards = []*model.Board{}
		}
		return boards, nil
	}
	if err != nil {
		return nil, err
	}

	return boards, nil
}

func (s *MattermostAuthLayer) SearchUserChannels(teamID, userID, query string) ([]*mmModel.Channel, error) {
	channels, err := s.servicesAPI.GetChannelsForTeamForUser(teamID, userID, false)
	if err != nil {
		return nil, err
	}
	lowerQuery := strings.ToLower(query)

	result := []*mmModel.Channel{}
	count := 0
	for _, channel := range channels {
		if channel.Type != mmModel.ChannelTypeDirect &&
			channel.Type != mmModel.ChannelTypeGroup &&
			(strings.Contains(strings.ToLower(channel.Name), lowerQuery) || strings.Contains(strings.ToLower(channel.DisplayName), lowerQuery)) {
			result = append(result, channel)
			count++
			if count >= 10 {
				break
			}
		}
	}
	return result, nil
}

func (s *MattermostAuthLayer) GetChannel(teamID, channelID string) (*mmModel.Channel, error) {
	channel, err := s.servicesAPI.GetChannelByID(channelID)
	if err != nil {
		return nil, err
	}
	return channel, nil
}

func (s *MattermostAuthLayer) getBoardsBotID() (string, error) {
	if boardsBotID == "" {
		var err error
		boardsBotID, err = s.servicesAPI.EnsureBot(model.FocalboardBot)
		s.logger.Error("failed to ensure boards bot", mlog.Err(err))
		return "", err
	}
	return boardsBotID, nil
}

func (s *MattermostAuthLayer) SendMessage(message, postType string, receipts []string) error {
	botID, err := s.getBoardsBotID()
	if err != nil {
		return err
	}

	for _, receipt := range receipts {
		channel, err := s.servicesAPI.GetDirectChannel(botID, receipt)
		if err != nil {
			s.logger.Error(
				"failed to get DM channel between system bot and user for receipt",
				mlog.String("receipt", receipt),
				mlog.String("user_id", receipt),
				mlog.Err(err),
			)
			continue
		}

		if err := s.PostMessage(message, postType, channel.Id); err != nil {
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

func (s *MattermostAuthLayer) PostMessage(message, postType, channelID string) error {
	botID, err := s.getBoardsBotID()
	if err != nil {
		return err
	}

	post := &mmModel.Post{
		Message:   message,
		UserId:    botID,
		ChannelId: channelID,
		Type:      postType,
	}

	if _, err := s.servicesAPI.CreatePost(post); err != nil {
		s.logger.Error(
			"failed to send message to receipt from PostMessage",
			mlog.Err(err),
		)
	}
	return nil
}

func (s *MattermostAuthLayer) GetUserTimezone(userID string) (string, error) {
	user, err := s.servicesAPI.GetUserByID(userID)
	if err != nil {
		return "", err
	}
	timezone := user.Timezone
	return mmModel.GetPreferredTimezone(timezone), nil
}

func (s *MattermostAuthLayer) CanSeeUser(seerID string, seenID string) (bool, error) {
	mmuser, appErr := s.servicesAPI.GetUserByID(seerID)
	if appErr != nil {
		return false, appErr
	}
	if !mmuser.IsGuest() {
		return true, nil
	}

	query := s.getQueryBuilder().
		Select("1").
		From(s.tablePrefix + "board_members AS BM1").
		Join(s.tablePrefix + "board_members AS BM2 ON BM1.BoardID=BM2.BoardID").
		LeftJoin("Bots b ON ( b.UserId = u.id )").
		Where(sq.Or{
			sq.And{
				sq.Eq{"BM1.UserID": seerID},
				sq.Eq{"BM2.UserID": seenID},
			},
			sq.And{
				sq.Eq{"BM1.UserID": seenID},
				sq.Eq{"BM2.UserID": seerID},
			},
		}).Limit(1)

	rows, err := query.Query()
	if err != nil {
		return false, err
	}
	defer s.CloseRows(rows)

	for rows.Next() {
		return true, err
	}

	query = s.getQueryBuilder().
		Select("1").
		From("ChannelMembers AS CM1").
		Join("ChannelMembers AS CM2 ON CM1.BoardID=CM2.BoardID").
		LeftJoin("Bots b ON ( b.UserId = u.id )").
		Where(sq.Or{
			sq.And{
				sq.Eq{"CM1.UserID": seerID},
				sq.Eq{"CM2.UserID": seenID},
			},
			sq.And{
				sq.Eq{"CM1.UserID": seenID},
				sq.Eq{"CM2.UserID": seerID},
			},
		}).Limit(1)

	rows, err = query.Query()
	if err != nil {
		return false, err
	}
	defer s.CloseRows(rows)

	for rows.Next() {
		return true, err
	}

	return false, nil
}
