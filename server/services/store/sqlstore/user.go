package sqlstore

import (
	"database/sql"
	"encoding/json"
	"fmt"

	sq "github.com/Masterminds/squirrel"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

type UserNotFoundError struct {
	id string
}

func (unf UserNotFoundError) Error() string {
	return fmt.Sprintf("user not found (%s)", unf.id)
}

func (s *SQLStore) getRegisteredUserCount(db sq.BaseRunner) (int, error) {
	query := s.getQueryBuilder(db).
		Select("count(*)").
		From(s.tablePrefix + "users").
		Where(sq.Eq{"delete_at": 0})
	row := query.QueryRow()

	var count int
	err := row.Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

func (s *SQLStore) getUserByCondition(db sq.BaseRunner, condition sq.Eq) (*model.User, error) {
	users, err := s.getUsersByCondition(db, condition, 0)
	if err != nil {
		return nil, err
	}

	if len(users) == 0 {
		return nil, nil
	}

	return users[0], nil
}

func (s *SQLStore) getUsersByCondition(db sq.BaseRunner, condition interface{}, limit uint64) ([]*model.User, error) {
	query := s.getQueryBuilder(db).
		Select(
			"id",
			"username",
			"email",
			"password",
			"mfa_secret",
			"auth_service",
			"auth_data",
			"props",
			"create_at",
			"update_at",
			"delete_at",
		).
		From(s.tablePrefix + "users").
		Where(sq.Eq{"delete_at": 0}).
		Where(condition)

	if limit != 0 {
		query = query.Limit(limit)
	}

	rows, err := query.Query()
	if err != nil {
		s.logger.Error(`getUsersByCondition ERROR`, mlog.Err(err))
		return nil, err
	}
	defer s.CloseRows(rows)

	users, err := s.usersFromRows(rows)
	if err != nil {
		return nil, err
	}

	if len(users) == 0 {
		return nil, sql.ErrNoRows
	}

	return users, nil
}

func (s *SQLStore) getUserByID(db sq.BaseRunner, userID string) (*model.User, error) {
	return s.getUserByCondition(db, sq.Eq{"id": userID})
}

func (s *SQLStore) getUserByEmail(db sq.BaseRunner, email string) (*model.User, error) {
	return s.getUserByCondition(db, sq.Eq{"email": email})
}

func (s *SQLStore) getUserByUsername(db sq.BaseRunner, username string) (*model.User, error) {
	return s.getUserByCondition(db, sq.Eq{"username": username})
}

func (s *SQLStore) createUser(db sq.BaseRunner, user *model.User) error {
	now := utils.GetMillis()

	propsBytes, err := json.Marshal(user.Props)
	if err != nil {
		return err
	}

	query := s.getQueryBuilder(db).Insert(s.tablePrefix+"users").
		Columns("id", "username", "email", "password", "mfa_secret", "auth_service", "auth_data", "props", "create_at", "update_at", "delete_at").
		Values(user.ID, user.Username, user.Email, user.Password, user.MfaSecret, user.AuthService, user.AuthData, propsBytes, now, now, 0)

	_, err = query.Exec()
	return err
}

func (s *SQLStore) updateUser(db sq.BaseRunner, user *model.User) error {
	now := utils.GetMillis()

	propsBytes, err := json.Marshal(user.Props)
	if err != nil {
		return err
	}

	query := s.getQueryBuilder(db).Update(s.tablePrefix+"users").
		Set("username", user.Username).
		Set("email", user.Email).
		Set("props", propsBytes).
		Set("update_at", now).
		Where(sq.Eq{"id": user.ID})

	result, err := query.Exec()
	if err != nil {
		return err
	}

	rowCount, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowCount < 1 {
		return UserNotFoundError{user.ID}
	}

	return nil
}

func (s *SQLStore) updateUserPassword(db sq.BaseRunner, username, password string) error {
	now := utils.GetMillis()

	query := s.getQueryBuilder(db).Update(s.tablePrefix+"users").
		Set("password", password).
		Set("update_at", now).
		Where(sq.Eq{"username": username})

	result, err := query.Exec()
	if err != nil {
		return err
	}

	rowCount, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowCount < 1 {
		return UserNotFoundError{username}
	}

	return nil
}

func (s *SQLStore) updateUserPasswordByID(db sq.BaseRunner, userID, password string) error {
	now := utils.GetMillis()

	query := s.getQueryBuilder(db).Update(s.tablePrefix+"users").
		Set("password", password).
		Set("update_at", now).
		Where(sq.Eq{"id": userID})

	result, err := query.Exec()
	if err != nil {
		return err
	}

	rowCount, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowCount < 1 {
		return UserNotFoundError{userID}
	}

	return nil
}

func (s *SQLStore) getUsersByTeam(db sq.BaseRunner, _ string) ([]*model.User, error) {
	return s.getUsersByCondition(db, nil, 0)
}

func (s *SQLStore) searchUsersByTeam(db sq.BaseRunner, _ string, searchQuery string) ([]*model.User, error) {
	return s.getUsersByCondition(db, &sq.Like{"username": "%" + searchQuery + "%"}, 10)
}

func (s *SQLStore) usersFromRows(rows *sql.Rows) ([]*model.User, error) {
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

func (s *SQLStore) patchUserProps(db sq.BaseRunner, userID string, patch model.UserPropPatch) error {
	user, err := s.getUserByID(db, userID)
	if err != nil {
		return err
	}

	if user.Props == nil {
		user.Props = map[string]interface{}{}
	}

	for _, key := range patch.DeletedFields {
		delete(user.Props, key)
	}

	for key, value := range patch.UpdatedFields {
		user.Props[key] = value
	}

	return s.updateUser(db, user)
}
