package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"runtime/debug"

	"github.com/gorilla/mux"
	"github.com/mattermost/focalboard/server/app"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/audit"
	"github.com/mattermost/focalboard/server/services/permissions"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	HeaderRequestedWith    = "X-Requested-With"
	HeaderRequestedWithXML = "XMLHttpRequest"
	UploadFormFileKey      = "file"
	True                   = "true"
)

const (
	ErrorNoTeamCode    = 1000
	ErrorNoTeamMessage = "No team"
)

var errAPINotSupportedInStandaloneMode = errors.New("API not supported in standalone mode")

type PermissionError struct {
	msg string
}

func (pe PermissionError) Error() string {
	return pe.msg
}

// ----------------------------------------------------------------------------------------------------
// REST APIs

type API struct {
	app             *app.App
	authService     string
	permissions     permissions.PermissionsService
	singleUserToken string
	MattermostAuth  bool
	logger          mlog.LoggerIFace
	audit           *audit.Audit
	isPlugin        bool
}

func NewAPI(
	app *app.App,
	singleUserToken string,
	authService string,
	permissions permissions.PermissionsService,
	logger mlog.LoggerIFace,
	audit *audit.Audit,
	isPlugin bool,
) *API {
	return &API{
		app:             app,
		singleUserToken: singleUserToken,
		authService:     authService,
		permissions:     permissions,
		logger:          logger,
		audit:           audit,
		isPlugin:        isPlugin,
	}
}

func (a *API) RegisterRoutes(r *mux.Router) {
	apiv2 := r.PathPrefix("/api/v2").Subrouter()
	apiv2.Use(a.panicHandler)
	apiv2.Use(a.requireCSRFToken)

	a.registerUsersRoutes(apiv2)
	a.registerAuthRoutes(apiv2)
	a.registerMembersRoutes(apiv2)
	a.registerCategoriesRoutes(apiv2)
	a.registerSharingRoutes(apiv2)
	a.registerTeamsRoutes(apiv2)
	a.registerAchivesRoutes(apiv2)
	a.registerSubscriptionsRoutes(apiv2)
	a.registerFilesRoutes(apiv2)
	a.registerLimitsRoutes(apiv2)
	a.registerInsightsRoutes(apiv2)
	a.registerOnboardingRoutes(apiv2)
	a.registerSearchRoutes(apiv2)
	a.registerConfigRoutes(apiv2)
	a.registerBoardsAndBlocksRoutes(apiv2)
	a.registerChannelsRoutes(apiv2)
	a.registerTemplatesRoutes(apiv2)
	a.registerBoardsRoutes(apiv2)
	a.registerBlocksRoutes(apiv2)

	// System routes are outside the /api/v2 path
	a.registerSystemRoutes(r)
}

func (a *API) RegisterAdminRoutes(r *mux.Router) {
	r.HandleFunc("/api/v2/admin/users/{username}/password", a.adminRequired(a.handleAdminSetPassword)).Methods("POST")
}

func getUserID(r *http.Request) string {
	ctx := r.Context()
	session, ok := ctx.Value(sessionContextKey).(*model.Session)
	if !ok {
		return ""
	}
	return session.UserID
}

func (a *API) panicHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if p := recover(); p != nil {
				a.logger.Error("Http handler panic",
					mlog.Any("panic", p),
					mlog.String("stack", string(debug.Stack())),
					mlog.String("uri", r.URL.Path),
				)
				a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", nil)
			}
		}()

		next.ServeHTTP(w, r)
	})
}

func (a *API) requireCSRFToken(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !a.checkCSRFToken(r) {
			a.logger.Error("checkCSRFToken FAILED")
			a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "checkCSRFToken FAILED", nil)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (a *API) checkCSRFToken(r *http.Request) bool {
	token := r.Header.Get(HeaderRequestedWith)
	return token == HeaderRequestedWithXML
}

func (a *API) hasValidReadTokenForBoard(r *http.Request, boardID string) bool {
	query := r.URL.Query()
	readToken := query.Get("read_token")

	if len(readToken) < 1 {
		return false
	}

	isValid, err := a.app.IsValidReadToken(boardID, readToken)
	if err != nil {
		a.logger.Error("IsValidReadTokenForBoard ERROR", mlog.Err(err))
		return false
	}

	return isValid
}

func (a *API) userIsGuest(userID string) (bool, error) {
	if a.singleUserToken != "" {
		return false, nil
	}
	return a.app.UserIsGuest(userID)
}

// Response helpers

func (a *API) errorResponse(w http.ResponseWriter, api string, code int, message string, sourceError error) {
	if code == http.StatusUnauthorized || code == http.StatusForbidden {
		a.logger.Debug("API DEBUG",
			mlog.Int("code", code),
			mlog.Err(sourceError),
			mlog.String("msg", message),
			mlog.String("api", api),
		)
	} else {
		a.logger.Error("API ERROR",
			mlog.Int("code", code),
			mlog.Err(sourceError),
			mlog.String("msg", message),
			mlog.String("api", api),
		)
	}

	setResponseHeader(w, "Content-Type", "application/json")
	data, err := json.Marshal(model.ErrorResponse{Error: message, ErrorCode: code})
	if err != nil {
		data = []byte("{}")
	}
	w.WriteHeader(code)
	_, _ = w.Write(data)
}

func stringResponse(w http.ResponseWriter, message string) {
	setResponseHeader(w, "Content-Type", "text/plain")
	_, _ = fmt.Fprint(w, message)
}

func jsonStringResponse(w http.ResponseWriter, code int, message string) {
	setResponseHeader(w, "Content-Type", "application/json")
	w.WriteHeader(code)
	fmt.Fprint(w, message)
}

func jsonBytesResponse(w http.ResponseWriter, code int, json []byte) {
	setResponseHeader(w, "Content-Type", "application/json")
	w.WriteHeader(code)
	_, _ = w.Write(json)
}

func setResponseHeader(w http.ResponseWriter, key string, value string) {
	header := w.Header()
	if header == nil {
		return
	}
	header.Set(key, value)
}
