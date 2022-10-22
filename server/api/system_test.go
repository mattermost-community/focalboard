package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"runtime"
	"testing"

	"github.com/mattermost/focalboard/server/app"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

func TestHello(t *testing.T) {
	testAPI := API{logger: mlog.CreateConsoleTestLogger(false, mlog.LvlDebug)}

	t.Run("Returns 'Hello' on success", func(t *testing.T) {
		request, _ := http.NewRequest(http.MethodGet, "/hello", nil)
		response := httptest.NewRecorder()

		testAPI.handleHello(response, request)

		got := response.Body.String()
		want := "Hello"

		if got != want {
			t.Errorf("got %q want %q", got, want)
		}

		if response.Code != http.StatusOK {
			t.Errorf("got HTTP %d want %d", response.Code, http.StatusOK)
		}
	})
}

func TestPing(t *testing.T) {
	testAPI := API{logger: mlog.CreateConsoleTestLogger(false, mlog.LvlDebug)}

	t.Run("Returns metadata on success", func(t *testing.T) {
		request, _ := http.NewRequest(http.MethodGet, "/ping", nil)
		response := httptest.NewRecorder()

		testAPI.handlePing(response, request)

		var got app.ServerMetadata
		err := json.NewDecoder(response.Body).Decode(&got)
		if err != nil {
			t.Fatalf("Unable to JSON decode response body %q", response.Body)
		}

		want := app.ServerMetadata{
			Version:     model.CurrentVersion,
			Commit:      model.BuildHash,
			BuildNumber: model.BuildNumber,
			BuildDate:   model.BuildDate,
			DBType:      "",
			DBVersion:   "",
			OSType:      runtime.GOOS,
			OSArch:      runtime.GOARCH,
			SKU:         "personal_server",
		}

		if got != want {
			t.Errorf("got %q want %q", got, want)
		}

		if response.Code != http.StatusOK {
			t.Errorf("got HTTP %d want %d", response.Code, http.StatusOK)
		}
	})
}
