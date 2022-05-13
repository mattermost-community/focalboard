package sqlstore

import (
	sq "github.com/Masterminds/squirrel"
	mmModel "github.com/mattermost/mattermost-server/v6/model"
)

func (s *SQLStore) getPortalAdmin(_ sq.BaseRunner) (*mmModel.User, error) {
	return nil, errUnsupportedOperation
}
