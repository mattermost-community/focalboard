package sqlstore

import (
	"encoding/json"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/mattermost/mattermost-octo-tasks/server/model"
)

func (s *SQLStore) GetSession(token string) (*model.Session, error) {
	query := s.getQueryBuilder().
		Select("id", "token", "user_id", "props").
		From("sessions").
		Where(sq.Eq{"token": token})

	row := query.QueryRow()
	session := model.Session{}

	var propsBytes []byte
	err := row.Scan(&session.ID, &session.Token, &session.UserID, &propsBytes)
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal(propsBytes, &session.Props)
	if err != nil {
		return nil, err
	}

	return &session, nil
}

func (s *SQLStore) CreateSession(session *model.Session) error {
	now := time.Now().Unix()

	propsBytes, err := json.Marshal(session.Props)
	if err != nil {
		return err
	}

	query := s.getQueryBuilder().Insert("sessions").
		Columns("id", "token", "user_id", "props", "create_at", "update_at").
		Values(session.ID, session.Token, session.UserID, propsBytes, now, now)

	_, err = query.Exec()
	return err
}

func (s *SQLStore) RefreshSession(session *model.Session) error {
	now := time.Now().Unix()

	query := s.getQueryBuilder().Update("sessions").
		Set("update_at", now)

	_, err := query.Exec()
	return err
}

func (s *SQLStore) UpdateSession(session *model.Session) error {
	now := time.Now().Unix()

	propsBytes, err := json.Marshal(session.Props)
	if err != nil {
		return err
	}

	query := s.getQueryBuilder().Update("sessions").
		Set("update_at", now).
		Set("props", propsBytes)

	_, err = query.Exec()
	return err
}

func (s *SQLStore) DeleteSession(sessionId string) error {
	query := s.getQueryBuilder().Delete("sessions").
		Where("id", sessionId)

	_, err := query.Exec()
	return err
}
