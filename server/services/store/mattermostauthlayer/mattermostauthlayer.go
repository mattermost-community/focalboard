package mattermostauthlayer

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"strings"
	"time"

	sq "github.com/Masterminds/squirrel"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
)

const (
	sqliteDBType   = "sqlite3"
	postgresDBType = "postgres"
)

// Store represents the abstraction of the data storage.
type MattermostAuthLayer struct {
	store.Store
	dbType string
	mmDB   *sql.DB
}

// New creates a new SQL implementation of the store.
func New(dbType, connectionString string, store store.Store) (*MattermostAuthLayer, error) {
	log.Println("connectDatabase", dbType, connectionString)
	var err error

	db, err := sql.Open(dbType, connectionString)
	if err != nil {
		log.Print("connectDatabase: ", err)

		return nil, err
	}

	err = db.Ping()
	if err != nil {
		log.Printf(`Database Ping failed: %v`, err)

		return nil, err
	}

	layer := &MattermostAuthLayer{
		Store:  store,
		dbType: dbType,
		mmDB:   db,
	}

	return layer, nil
}

// Shutdown close the connection with the store.
func (s *MattermostAuthLayer) Shutdown() error {
	err := s.Store.Shutdown()
	if err != nil {
		return err
	}
	return s.mmDB.Close()
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
	query := s.getQueryBuilder().
		Select("id", "username", "email", "password", "MFASecret as mfa_secret", "AuthService as auth_service", "COALESCE(AuthData, '') as auth_data",
			"props", "CreateAt as create_at", "UpdateAt as update_at", "DeleteAt as delete_at").
		From("Users").
		Where(sq.Eq{"deleteAt": 0}).
		Where(condition)
	row := query.QueryRow()
	user := model.User{}

	var propsBytes []byte
	err := row.Scan(&user.ID, &user.Username, &user.Email, &user.Password, &user.MfaSecret, &user.AuthService,
		&user.AuthData, &propsBytes, &user.CreateAt, &user.UpdateAt, &user.DeleteAt)
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal(propsBytes, &user.Props)
	if err != nil {
		return nil, err
	}

	return &user, nil
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
	return errors.New("no user creation allowed from focalboard, create it using mattermost")
}

func (s *MattermostAuthLayer) UpdateUser(user *model.User) error {
	return errors.New("no update allowed from focalboard, update it using mattermost")
}

func (s *MattermostAuthLayer) UpdateUserPassword(username, password string) error {
	return errors.New("no update allowed from focalboard, update it using mattermost")
}

func (s *MattermostAuthLayer) UpdateUserPasswordByID(userID, password string) error {
	return errors.New("no update allowed from focalboard, update it using mattermost")
}

// GetActiveUserCount returns the number of users with active sessions within N seconds ago.
func (s *MattermostAuthLayer) GetActiveUserCount(updatedSecondsAgo int64) (int, error) {
	query := s.getQueryBuilder().
		Select("count(distinct userId)").
		From("Sessions").
		Where(sq.Gt{"LastActivityAt": time.Now().Unix() - updatedSecondsAgo})

	row := query.QueryRow()

	var count int
	err := row.Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

func (s *MattermostAuthLayer) GetSession(token string, expireTime int64) (*model.Session, error) {
	return nil, errors.New("sessions not used when using mattermost")
}

func (s *MattermostAuthLayer) CreateSession(session *model.Session) error {
	return errors.New("no update allowed from focalboard, update it using mattermost")
}

func (s *MattermostAuthLayer) RefreshSession(session *model.Session) error {
	return errors.New("no update allowed from focalboard, update it using mattermost")
}

func (s *MattermostAuthLayer) UpdateSession(session *model.Session) error {
	return errors.New("no update allowed from focalboard, update it using mattermost")
}

func (s *MattermostAuthLayer) DeleteSession(sessionID string) error {
	return errors.New("no update allowed from focalboard, update it using mattermost")
}

func (s *MattermostAuthLayer) CleanUpSessions(expireTime int64) error {
	return errors.New("no update allowed from focalboard, update it using mattermost")
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
	first := true
	for rows.Next() {
		if first {
			sb.WriteString(", ")
			first = false
		}
		var name string
		if err := rows.Scan(&name); err != nil {
			log.Fatal(err)
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
		Select("id", "username", "email", "password", "MFASecret as mfa_secret", "AuthService as auth_service", "COALESCE(AuthData, '') as auth_data",
			"props", "CreateAt as create_at", "UpdateAt as update_at", "DeleteAt as delete_at").
		From("Users").
		Join("ChannelMembers ON ChannelMembers.UserID = Users.ID").
		Where(sq.Eq{"deleteAt": 0}).
		Where(sq.Eq{"ChannelMembers.ChannelId": workspaceID})

	rows, err := query.Query()
	if err != nil {
		return nil, err
	}

	users, err := s.usersFromRows(rows)
	if err != nil {
		return nil, err
	}

	return users, nil
}

func (s *MattermostAuthLayer) usersFromRows(rows *sql.Rows) ([]*model.User, error) {
	defer rows.Close()

	users := []*model.User{}

	for rows.Next() {
		var user model.User
		var propsBytes []byte

		err := rows.Scan(
			&user.ID,
			&user.Username,
			&user.Email,
			&user.Password,
			&user.MfaSecret,
			&user.AuthService,
			&user.AuthData,
			&propsBytes,
			&user.CreateAt,
			&user.UpdateAt,
			&user.DeleteAt,
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
