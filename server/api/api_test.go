package api

import (
	"errors"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
	"github.com/stretchr/testify/require"
)

func TestErrorResponse(t *testing.T) {
	testApi := API{logger: mlog.CreateConsoleTestLogger(false, mlog.LvlDebug)}

	t.Run("should respond with a 404 if a not found error is passed", func(t *testing.T) {
		r := httptest.NewRequest(http.MethodGet, "/test", nil)
		w := httptest.NewRecorder()
		err := model.NewErrNotFound("board")

		testApi.errorResponse(w, r, err)
		res := w.Result()

		require.Equal(t, http.StatusNotFound, res.StatusCode)
		require.Equal(t, "application/json", res.Header.Get("Content-Type"))
		b, rErr := ioutil.ReadAll(res.Body)
		require.NoError(t, rErr)
		defer res.Body.Close()
		require.Contains(t, string(b), "board")
	})

	t.Run("should respond with a 500 if an unknown error is passed", func(t *testing.T) {
		r := httptest.NewRequest(http.MethodGet, "/test", nil)
		w := httptest.NewRecorder()
		err := errors.New("shomething went wrong")

		testApi.errorResponse(w, r, err)
		res := w.Result()

		require.Equal(t, http.StatusInternalServerError, res.StatusCode)
		require.Equal(t, "application/json", res.Header.Get("Content-Type"))
	})
}
