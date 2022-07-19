// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package boards

import (
	"errors"
	"net/http"

	mm_model "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"

	"github.com/mattermost/focalboard/server/model"
)

type mutexAPIAdapter struct {
	api model.ServicesAPI
}

func (m *mutexAPIAdapter) KVSetWithOptions(key string, value []byte, options mm_model.PluginKVSetOptions) (bool, *mm_model.AppError) {
	b, err := m.api.KVSetWithOptions(key, value, options)

	var appErr *mm_model.AppError
	if err != nil {
		if !errors.As(err, &appErr) {
			appErr = mm_model.NewAppError("KVSetWithOptions", "", nil, "", http.StatusInternalServerError)
		}
	}
	return b, appErr
}

func (m *mutexAPIAdapter) LogError(msg string, keyValuePairs ...interface{}) {
	m.api.GetLogger().Error(msg, mlog.Array("kvpairs", keyValuePairs))
}
