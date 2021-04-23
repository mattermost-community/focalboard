//go:generate mockgen -destination=mockstore/mockstore.go -package mockstore . Store
package mattermostauthlayer

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"time"

	sq "github.com/Masterminds/squirrel"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
)

// Store represents the abstraction of the data storage.
type MattermostAuthLayer struct {
	store.Store
	mmDB *sql.DB
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
		Store: store,
		mmDB:  db,
	}

	return layer, nil
}

// Shutdown close the connection with the store.
func (l *MattermostAuthLayer) Shutdown() error {
	err := l.Store.Shutdown()
	if err != nil {
		return err
	}
	return l.mmDB.Close()
}

func (s *MattermostAuthLayer) GetRegisteredUserCount() (int, error) {
	query := s.getQueryBuilder().
		Select("count(*)").
		From("users").
		Where(sq.Eq{"delete_at": 0})
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
		Select("id", "username", "email", "password", "mfa_secret", "auth_service", "auth_data", "props", "create_at", "update_at", "delete_at").
		From("users").
		Where(sq.Eq{"delete_at": 0}).
		Where(condition)
	row := query.QueryRow()
	user := model.User{}

	var propsBytes []byte
	err := row.Scan(&user.ID, &user.Username, &user.Email, &user.Password, &user.MfaSecret, &user.AuthService, &user.AuthData, &propsBytes, &user.CreateAt, &user.UpdateAt, &user.DeleteAt)
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal(propsBytes, &user.Props)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (s *MattermostAuthLayer) GetUserById(userID string) (*model.User, error) {
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

// GetActiveUserCount returns the number of users with active sessions within N seconds ago
func (s *MattermostAuthLayer) GetActiveUserCount(updatedSecondsAgo int64) (int, error) {
	query := s.getQueryBuilder().
		Select("count(distinct user_id)").
		From("sessions").
		Where(sq.Gt{"update_at": time.Now().Unix() - updatedSecondsAgo})

	row := query.QueryRow()

	var count int
	err := row.Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

func (s *MattermostAuthLayer) GetSession(token string, expireTime int64) (*model.Session, error) {
	query := s.getQueryBuilder().
		Select("id", "token", "user_id", "auth_service", "props").
		From("sessions").
		Where(sq.Eq{"token": token}).
		Where(sq.Gt{"update_at": time.Now().Unix() - expireTime})

	row := query.QueryRow()
	session := model.Session{}

	var propsBytes []byte
	err := row.Scan(&session.ID, &session.Token, &session.UserID, &session.AuthService, &propsBytes)
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal(propsBytes, &session.Props)
	if err != nil {
		return nil, err
	}

	return &session, nil
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

func (s *MattermostAuthLayer) DeleteSession(sessionId string) error {
	return errors.New("no update allowed from focalboard, update it using mattermost")
}

func (s *MattermostAuthLayer) CleanUpSessions(expireTime int64) error {
	return errors.New("no update allowed from focalboard, update it using mattermost")
}

func (s *MattermostAuthLayer) getQueryBuilder() sq.StatementBuilderType {
	builder := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)

	return builder.RunWith(s.mmDB)
}
