package sqlstore

import (
	"time"

	"github.com/mattermost/focalboard/server/model"

	sq "github.com/Masterminds/squirrel"
)

func (s *SQLStore) UpsertSharing(sharing model.Sharing) error {
	now := time.Now().Unix()

	query := s.getQueryBuilder().
		Insert("sharing").
		Columns(
			"id",
			"enabled",
			"token",
			"modified_by",
			"update_at",
		).
		Values(
			sharing.ID,
			sharing.Enabled,
			sharing.Token,
			sharing.ModifiedBy,
			now,
		).
		Suffix("ON CONFLICT (id) DO UPDATE SET enabled = EXCLUDED.enabled, token = EXCLUDED.token, modified_by = EXCLUDED.modified_by, update_at = EXCLUDED.update_at")

	_, err := query.Exec()
	return err
}

func (s *SQLStore) GetSharing(rootID string) (*model.Sharing, error) {
	query := s.getQueryBuilder().
		Select(
			"id",
			"enabled",
			"token",
			"modified_by",
			"update_at",
		).
		From("sharing").
		Where(sq.Eq{"id": rootID})
	row := query.QueryRow()
	sharing := model.Sharing{}

	err := row.Scan(
		&sharing.ID,
		&sharing.Enabled,
		&sharing.Token,
		&sharing.ModifiedBy,
		&sharing.UpdateAt,
	)
	if err != nil {
		return nil, err
	}

	return &sharing, nil
}
