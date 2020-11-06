package sqlstore

import (
	"encoding/json"
	"time"

	"github.com/mattermost/mattermost-octo-tasks/server/model"

	sq "github.com/Masterminds/squirrel"
)

func (s *SQLStore) getUserByCondition(condition sq.Eq) (*model.User, error) {
	query := s.getQueryBuilder().
		Select("id", "username", "email", "password", "mfa_secret", "auth_service", "auth_data", "props", "create_at", "update_at", "delete_at").
		From("users").
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

func (s *SQLStore) GetUserById(userID string) (*model.User, error) {
	return s.getUserByCondition(sq.Eq{"id": userID})
}

func (s *SQLStore) GetUserByEmail(email string) (*model.User, error) {
	return s.getUserByCondition(sq.Eq{"email": email})
}

func (s *SQLStore) GetUserByUsername(username string) (*model.User, error) {
	return s.getUserByCondition(sq.Eq{"username": username})
}

func (s *SQLStore) CreateUser(user *model.User) error {
	now := time.Now().Unix()

	propsBytes, err := json.Marshal(user.Props)
	if err != nil {
		return err
	}

	query := s.getQueryBuilder().Insert("users").
		Columns("id", "username", "email", "password", "mfa_secret", "auth_service", "auth_data", "props", "create_at", "update_at", "delete_at").
		Values(user.ID, user.Username, user.Email, user.Password, user.MfaSecret, user.AuthService, user.AuthData, propsBytes, now, now, 0)

	_, err = query.Exec()
	return err
}

func (s *SQLStore) UpdateUser(user *model.User) error {
	now := time.Now().Unix()

	propsBytes, err := json.Marshal(user.Props)
	if err != nil {
		return err
	}

	query := s.getQueryBuilder().Update("users").
		Set("username", user.Username).
		Set("email", user.Email).
		Set("props", propsBytes).
		Set("update_at", now)

	_, err = query.Exec()
	return err
}
