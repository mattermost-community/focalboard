package sqlstore

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/mattermost/focalboard/server/model"

	sq "github.com/Masterminds/squirrel"
)

type UserNotFoundError struct {
	id string
}

func (unf UserNotFoundError) Error() string {
	return fmt.Sprintf("user not found (%s)", unf.id)
}

func (s *SQLStore) getRegisteredUserCount(tx *sql.Tx) (int, error) {
	query := s.getQueryBuilder(tx).
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

func (s *SQLStore) getUserByCondition(tx *sql.Tx, condition sq.Eq) (*model.User, error) {
	users, err := s.getUsersByCondition(tx, condition)
	if err != nil {
		return nil, err
	}

	if len(users) == 0 {
		return nil, nil
	}

	return users[0], nil
}

func (s *SQLStore) getUsersByCondition(tx *sql.Tx, condition sq.Eq) ([]*model.User, error) {
	query := s.getQueryBuilder(tx).
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
	rows, err := query.Query()
	if err != nil {
		log.Printf("getUsersByCondition ERROR: %v", err)
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

func (s *SQLStore) getUserByID(tx *sql.Tx, userID string) (*model.User, error) {
	return s.getUserByCondition(tx, sq.Eq{"id": userID})
}

func (s *SQLStore) getUserByEmail(tx *sql.Tx, email string) (*model.User, error) {
	return s.getUserByCondition(tx, sq.Eq{"email": email})
}

func (s *SQLStore) getUserByUsername(tx *sql.Tx, username string) (*model.User, error) {
	return s.getUserByCondition(tx, sq.Eq{"username": username})
}

func (s *SQLStore) createUser(tx *sql.Tx, user *model.User) error {
	now := time.Now().Unix()

	propsBytes, err := json.Marshal(user.Props)
	if err != nil {
		return err
	}

	query := s.getQueryBuilder(tx).Insert(s.tablePrefix+"users").
		Columns("id", "username", "email", "password", "mfa_secret", "auth_service", "auth_data", "props", "create_at", "update_at", "delete_at").
		Values(user.ID, user.Username, user.Email, user.Password, user.MfaSecret, user.AuthService, user.AuthData, propsBytes, now, now, 0)

	_, err = query.Exec()
	return err
}

func (s *SQLStore) updateUser(tx *sql.Tx, user *model.User) error {
	now := time.Now().Unix()

	propsBytes, err := json.Marshal(user.Props)
	if err != nil {
		return err
	}

	query := s.getQueryBuilder(tx).Update(s.tablePrefix+"users").
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

func (s *SQLStore) updateUserPassword(tx *sql.Tx, username, password string) error {
	now := time.Now().Unix()

	query := s.getQueryBuilder(tx).Update(s.tablePrefix+"users").
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

func (s *SQLStore) updateUserPasswordByID(tx *sql.Tx, userID, password string) error {
	now := time.Now().Unix()

	query := s.getQueryBuilder(tx).Update(s.tablePrefix+"users").
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

func (s *SQLStore) getUsersByWorkspace(tx *sql.Tx, _ string) ([]*model.User, error) {
	return s.getUsersByCondition(tx, nil)
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
