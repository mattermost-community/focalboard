package sqlstore

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"

	mmModel "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/store"

	sq "github.com/Masterminds/squirrel"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

var (
	errUnsupportedOperation = errors.New("unsupported operation")
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

func (s *SQLStore) getUsersList(db sq.BaseRunner, userIDs []string) ([]*model.User, error) {
	return s.getUsersByCondition(db, sq.Eq{"id": userIDs}, 0)
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

func (s *SQLStore) getUsersByTeam(db sq.BaseRunner, _ string, _ string) ([]*model.User, error) {
	return s.getUsersByCondition(db, nil, 0)
}

func (s *SQLStore) searchUsersByTeam(db sq.BaseRunner, _ string, searchQuery string, _ string, _ bool) ([]*model.User, error) {
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
	if len(patch.UpdatedFields) > 0 {
		for key, value := range patch.UpdatedFields {
			preference := mmModel.Preference{
				UserId:   userID,
				Category: model.PreferencesCategoryFocalboard,
				Name:     key,
				Value:    value,
			}

			if err := s.updateUserProps(db, preference); err != nil {
				return err
			}
		}
	}

	if len(patch.DeletedFields) > 0 {
		for _, key := range patch.DeletedFields {
			preference := mmModel.Preference{
				UserId:   userID,
				Category: model.PreferencesCategoryFocalboard,
				Name:     key,
			}

			if err := s.deleteUserProps(db, preference); err != nil {
				return err
			}
		}
	}

	return nil
}

func (s *SQLStore) updateUserProps(db sq.BaseRunner, preference mmModel.Preference) error {
	query := s.getQueryBuilder(db).
		Insert(s.tablePrefix+"preferences").
		Columns("UserId", "Category", "Name", "Value").
		Values(preference.UserId, preference.Category, preference.Name, preference.Value)

	switch s.dbType {
	case model.MysqlDBType:
		query = query.SuffixExpr(sq.Expr("ON DUPLICATE KEY UPDATE Value = ?", preference.Value))
	case model.PostgresDBType:
		query = query.SuffixExpr(sq.Expr("ON CONFLICT (userid, category, name) DO UPDATE SET Value = ?", preference.Value))
	case model.SqliteDBType:
		query = query.SuffixExpr(sq.Expr(" on conflict(userid, category, name) do update set value = excluded.value"))
	default:
		return store.NewErrNotImplemented("failed to update preference because of missing driver")
	}

	if _, err := query.Exec(); err != nil {
		return fmt.Errorf("failed to upsert user preference in database: userID: %s name: %s value: %s error: %w", preference.UserId, preference.Name, preference.Value, err)
	}

	return nil
}

func (s *SQLStore) deleteUserProps(db sq.BaseRunner, preference mmModel.Preference) error {
	query := s.getQueryBuilder(db).
		Delete(s.tablePrefix + "preferences").
		Where(sq.Eq{"UserId": preference.UserId}).
		Where(sq.Eq{"Category": preference.Category}).
		Where(sq.Eq{"Name": preference.Name})

	if _, err := query.Exec(); err != nil {
		return fmt.Errorf("failed to delete user preference from database: %w", err)
	}

	return nil
}

func (s *SQLStore) canSeeUser(db sq.BaseRunner, seerID string, seenID string) (bool, error) {
	return true, nil
}

func (s *SQLStore) sendMessage(db sq.BaseRunner, message, postType string, receipts []string) error {
	return errUnsupportedOperation
}

func (s *SQLStore) postMessage(db sq.BaseRunner, message, postType string, channel string) error {
	return errUnsupportedOperation
}

func (s *SQLStore) getUserTimezone(_ sq.BaseRunner, _ string) (string, error) {
	return "", errUnsupportedOperation
}

func (s *SQLStore) getUserPreferences(db sq.BaseRunner, userID string) (mmModel.Preferences, error) {
	query := s.getQueryBuilder(db).
		Select("userid", "category", "name", "value").
		From(s.tablePrefix + "preferences").
		Where(sq.Eq{
			"userid":   userID,
			"category": model.PreferencesCategoryFocalboard,
		})

	rows, err := query.Query()
	if err != nil {
		s.logger.Error("failed to fetch user preferences", mlog.String("user_id", userID), mlog.Err(err))
		return nil, err
	}

	defer rows.Close()

	preferences, err := s.preferencesFromRows(rows)
	if err != nil {
		return nil, err
	}

	return preferences, nil
}

func (s *SQLStore) preferencesFromRows(rows *sql.Rows) ([]mmModel.Preference, error) {
	preferences := []mmModel.Preference{}

	for rows.Next() {
		var preference mmModel.Preference

		err := rows.Scan(
			&preference.UserId,
			&preference.Category,
			&preference.Name,
			&preference.Value,
		)

		if err != nil {
			s.logger.Error("failed to scan row for user preference", mlog.Err(err))
			return nil, err
		}

		preferences = append(preferences, preference)
	}

	return preferences, nil
}
