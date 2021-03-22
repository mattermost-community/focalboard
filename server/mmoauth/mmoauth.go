package mmauth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/mattermost/focalboard/server/app"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"golang.org/x/oauth2"

	mattermost "github.com/mattermost/mattermost-server/v5/model"
)

type MMOAuthParameters struct {
	ServerRoot    string
	MattermostURL string
	ClientID      string
	ClientSecret  string
}

type MMOAuth struct {
	appBuilder func() *app.App
	store      store.Store
	config     *oauth2.Config
	params     MMOAuthParameters
}

func NewMMOAuth(params MMOAuthParameters, appBuilder func() *app.App, store store.Store) *MMOAuth {
	callbackURL := fmt.Sprintf("%s/oauth/callback", params.ServerRoot)

	authURL := fmt.Sprintf("%s/oauth/authorize", params.MattermostURL)
	tokenURL := fmt.Sprintf("%s/oauth/access_token", params.MattermostURL)
	endpoint := oauth2.Endpoint{
		AuthURL:   authURL,
		TokenURL:  tokenURL,
		AuthStyle: oauth2.AuthStyleAutoDetect,
	}

	config := &oauth2.Config{
		RedirectURL:  callbackURL,
		ClientID:     params.ClientID,
		ClientSecret: params.ClientSecret,
		Scopes:       nil,
		Endpoint:     endpoint,
	}

	return &MMOAuth{
		appBuilder: appBuilder,
		store:      store,
		params:     params,
		config:     config,
	}
}

func (a *MMOAuth) app() *app.App {
	return a.appBuilder()
}

func (a *MMOAuth) RegisterRoutes(r *mux.Router) {
	// This replaces the native login page
	r.HandleFunc("/login", a.handleOAuthLogin).Methods("GET")
	r.HandleFunc("/oauth/callback", a.handleOAuthCallback).Methods("GET")
}

func (a *MMOAuth) handleOAuthLogin(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	redirectUrl := query.Get("r")

	var expiration = time.Now().Add(365 * 24 * time.Hour)

	redirectCookie := http.Cookie{Name: "oauthredirect", Path: "/", Value: redirectUrl, Expires: expiration, HttpOnly: true}
	http.SetCookie(w, &redirectCookie)

	oauthState := generateSecurityToken()
	stateCookie := http.Cookie{Name: "oauthstate", Path: "/", Value: oauthState, Expires: expiration, HttpOnly: true}
	http.SetCookie(w, &stateCookie)

	authUrl := a.config.AuthCodeURL(oauthState)
	http.Redirect(w, r, authUrl, http.StatusTemporaryRedirect)
}

func generateSecurityToken() string {
	b := make([]byte, 16)
	rand.Read(b)
	securityToken := base64.URLEncoding.EncodeToString(b)
	return securityToken
}

func deleteCookie(name string, w http.ResponseWriter) {
	redirectCookie := http.Cookie{Name: name, Path: "/", Value: "", MaxAge: -1, Expires: time.Now().Add(-100 * time.Hour), HttpOnly: true}
	http.SetCookie(w, &redirectCookie)
}

func (a *MMOAuth) handleOAuthCallback(w http.ResponseWriter, r *http.Request) {
	// Read oauthState from Cookie
	stateCookie, err := r.Cookie("oauthstate")
	if err != nil {
		a.handleError("oauthstate cookie not found", err, w, r)
		return
	}

	redirectCookie, err := r.Cookie("oauthredirect")
	if err != nil {
		a.handleError("oauthredirect cookie not found", err, w, r)
		return
	}

	// Delete cookies
	deleteCookie("oauthredirect", w)
	deleteCookie("oauthstate", w)

	if r.FormValue("state") != stateCookie.Value {
		log.Println("invalid oauth state")
		http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
		return
	}

	code := r.FormValue("code")
	token, err := a.config.Exchange(context.Background(), code)
	if err != nil {
		a.handleError("code exchange error", err, w, r)
		return
	}

	// Get user info from Mattermost
	client := mattermost.NewAPIv4Client(a.params.MattermostURL)
	client.SetOAuthToken(token.AccessToken)

	etag := ""
	user, resp := client.GetMe(etag)
	if resp.Error != nil {
		a.handleError("failed getting Mattermost user", resp.Error, w, r)
		return
	}

	log.Printf("UserInfo: %v\n", user)

	teams, resp := client.GetAllTeams(etag, 0, 10)
	if resp.Error != nil {
		a.handleError("failed getting Mattermost teams", err, w, r)
		return
	}

	if len(teams) < 1 {
		a.handleError("User has no teams", err, w, r)
		return
	}

	log.Printf("%d team(s).", len(teams))
	teamId := teams[0].Id

	channels, resp := client.GetChannelsForTeamForUser(teamId, user.Id, false, etag)
	if resp.Error != nil {
		a.handleError("failed getting Mattermost channels for user", err, w, r)
		return
	}

	if len(channels) < 1 {
		a.handleError("User has no channels", err, w, r)
		return
	}

	log.Printf("%d channel(s).", len(channels))
	channelId := channels[0].Id

	log.Printf("userId: %s, teamId: %s, channelId: %s", user.Id, teamId, channelId)

	// Create native user
	nativeUser, _ := a.store.GetUserById(user.Id)
	if nativeUser == nil {
		err = a.store.CreateUser(&model.User{
			ID:          user.Id,
			Username:    user.Username,
			Email:       user.Email,
			Password:    "",
			MfaSecret:   "",
			AuthService: "mattermost",
			AuthData:    "",
			Props:       map[string]interface{}{},
		})
		if err != nil {
			a.handleError("Unable to create the new user", err, w, r)
			return
		}
	}

	// Create session
	// TODO: Remove any existing sessions with the same token? (Happens on re-login)
	session := model.Session{
		ID:     uuid.New().String(),
		Token:  token.AccessToken,
		UserID: user.Id,
		Props: map[string]interface{}{
			"authService":  "mattermost",
			"expiry":       token.Expiry.Unix(),
			"refreshToken": token.RefreshToken,
		},
	}
	err = a.store.CreateSession(&session)
	if err != nil {
		a.handleError("unable to create session", err, w, r)
		return
	}

	// Pass access token to client via cookie
	// TODO: Review security of this approach
	var expiration = time.Now().Add(365 * 24 * time.Hour)
	tokenCookie := http.Cookie{Name: "oauthtoken", Path: "/", Value: token.AccessToken, Expires: expiration, HttpOnly: false}
	http.SetCookie(w, &tokenCookie)

	redirectUrl := redirectCookie.Value
	if len(redirectUrl) == 0 {
		// TODO: Implement user error page
		redirectUrl = "/error?id=no_workspace"
	}

	log.Printf("Redirecting to: %s", redirectUrl)
	http.Redirect(w, r, redirectUrl, http.StatusTemporaryRedirect)
}

func (a *MMOAuth) handleError(logInfo string, err error, w http.ResponseWriter, r *http.Request) {
	log.Printf("%s. ERROR: %s\n", logInfo, err)
	// TODO: Implement user error page
	http.Redirect(w, r, "/error?id=server_error", http.StatusTemporaryRedirect)
}

func (a *MMOAuth) DoesUserHaveWorkspaceAccess(session *model.Session, workspaceID string) bool {
	// Check that the user has access to the channel with id = workspaceID
	// TODO: Cache this in memory
	client := mattermost.NewAPIv4Client(a.params.MattermostURL)
	client.SetOAuthToken(session.Token)

	etag := ""
	member, resp := client.GetChannelMember(workspaceID, session.UserID, etag)
	if member == nil || resp.Error != nil {
		return false
	}

	return true
}
