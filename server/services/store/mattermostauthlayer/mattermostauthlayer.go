package mattermostauthlayer

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

	mmModel "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/plugin"

	sq "github.com/Masterminds/squirrel"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

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
}

// New creates a new SQL implementation of the store.
func New(dbType string, db *sql.DB, store store.Store, logger *mlog.Logger, pluginAPI plugin.API, tablePrefix string) (*MattermostAuthLayer, error) {
	layer := &MattermostAuthLayer{
		Store:       store,
		dbType:      dbType,
		mmDB:        db,
		logger:      logger,
		pluginAPI:   pluginAPI,
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
		Where(sq.Eq{"tm.UserId": userID})

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

func (s *MattermostAuthLayer) GetCloudLimits() (*mmModel.ProductLimits, error) {
	return s.pluginAPI.GetCloudLimits()
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
		b, err := s.Store.GetBoard(boardID)
		if err != nil {
			return nil, err
		}
		if b.ChannelID != "" {
			_, err := s.pluginAPI.GetChannelMember(b.ChannelID, userID)
			if err != nil {
				return nil, err
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
		Select("Cm.userID, B.Id").
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
		Select("Cm.userID, B.Id").
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

// searchBoardsForUser returns all boards that match with the
// term that are either private and which the user is a member of, or
// they're open, regardless of the user membership.
// Search is case-insensitive.
func (s *MattermostAuthLayer) SearchBoardsForUser(term, userID string) ([]*model.Board, error) {
	// TODO: Make this efficient
	members, err := s.GetMembersForUser(userID)
	if err != nil {
		return nil, err
	}

	explicitBoards, err := s.Store.SearchBoardsForUser(term, userID)
	if err != nil {
		return nil, err
	}

	explicitBoardsExists := map[string]bool{}
	for _, b := range explicitBoards {
		explicitBoardsExists[b.ID] = true
	}

	boards := explicitBoards
	for _, m := range members {
		if explicitBoardsExists[m.BoardID] {
			continue
		}

		board, err := s.GetBoard(m.BoardID)
		if err != nil {
			return nil, err
		}
		for _, q := range strings.Fields(term) {
			if !strings.Contains(board.Title, q) {
				continue
			}
		}
		if board.IsTemplate {
			continue
		}
		boards = append(boards, board)
	}
	return boards, nil
}

func (s *MattermostAuthLayer) GetBoardsForUserAndTeam(userID, teamID string) ([]*model.Board, error) {
	// TODO: Make this efficient
	members, err := s.GetMembersForUser(userID)
	if err != nil {
		return nil, err
	}

	explicitBoards, err := s.Store.GetBoardsForUserAndTeam(userID, teamID)
	if err != nil {
		return nil, err
	}

	explicitBoardsExists := map[string]bool{}
	for _, b := range explicitBoards {
		explicitBoardsExists[b.ID] = true
	}

	boards := explicitBoards
	for _, m := range members {
		if explicitBoardsExists[m.BoardID] {
			continue
		}

		board, err := s.GetBoard(m.BoardID)
		if err != nil {
			return nil, err
		}
		if board.TeamID != teamID {
			continue
		}
		if board.IsTemplate {
			continue
		}
		boards = append(boards, board)
	}
	return boards, nil
}

func (s *MattermostAuthLayer) SearchUserChannels(teamID, userID, query string) ([]*mmModel.Channel, error) {
	channels, err := s.pluginAPI.GetChannelsForTeamForUser(teamID, userID, false)
	if err != nil {
		return nil, err
	}

	result := []*mmModel.Channel{}
	count := 0
	for _, channel := range channels {
		if channel.Type != "D" && channel.Type != "G" && (strings.Contains(channel.Name, query) || strings.Contains(channel.DisplayName, query)) {
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
	channel, err := s.pluginAPI.GetChannel(channelID)
	if err != nil {
		return nil, err
	}
	return channel, nil
}
