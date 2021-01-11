package app

import (
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/mattermost/mattermost-octo-tasks/server/model"
	"github.com/mattermost/mattermost-octo-tasks/server/services/auth"

	"github.com/pkg/errors"
)

// GetSession Get a user active session and refresh the session if is needed
func (a *App) GetSession(token string) (*model.Session, error) {
	session, err := a.store.GetSession(token, a.config.SessionExpireTime)
	if err != nil {
		return nil, errors.Wrap(err, "unable to get the session for the token")
	}
	if session.UpdateAt < (time.Now().Unix() - a.config.SessionRefreshTime) {
		a.store.RefreshSession(session)
	}
	return session, nil
}

// GetUser Get an existing active user by id
func (a *App) GetUser(ID string) (*model.User, error) {
	user, err := a.store.GetUserById(ID)
	if err != nil {
		return nil, errors.Wrap(err, "unable to get the session for the token")
	}
	return user, nil
}

// Login create a new user session if the authentication data is valid
func (a *App) Login(username string, email string, password string, mfaToken string) (string, error) {
	var user *model.User
	if username != "" {
		var err error
		user, err = a.store.GetUserByUsername(username)
		if err != nil {
			return "", errors.Wrap(err, "invalid username or password")
		}
	}

	if user == nil && email != "" {
		var err error
		user, err = a.store.GetUserByEmail(email)
		if err != nil {
			return "", errors.Wrap(err, "invalid username or password")
		}
	}
	if user == nil {
		return "", errors.New("invalid username or password")
	}

	if !auth.ComparePassword(user.Password, password) {
		log.Printf("Not valid passowrd. %s (%s)\n", password, user.Password)
		return "", errors.New("invalid username or password")
	}

	session := model.Session{
		ID:     uuid.New().String(),
		Token:  uuid.New().String(),
		UserID: user.ID,
		Props:  map[string]interface{}{},
	}
	err := a.store.CreateSession(&session)
	if err != nil {
		return "", errors.Wrap(err, "unable to create session")
	}

	// TODO: MFA verification
	return session.Token, nil
}

// RegisterUser create a new user if the provided data is valid
func (a *App) RegisterUser(username string, email string, password string) error {
	var user *model.User
	if username != "" {
		var err error
		user, err = a.store.GetUserByUsername(username)
		if err == nil && user != nil {
			return errors.Wrap(err, "The username already exists")
		}
	}

	if user == nil && email != "" {
		var err error
		user, err = a.store.GetUserByEmail(email)
		if err == nil && user != nil {
			return errors.Wrap(err, "The email already exists")
		}
	}

	// TODO: Move this into the config
	passwordSettings := auth.PasswordSettings{
		MinimumLength: 6,
	}

	err := auth.IsPasswordValid(password, passwordSettings)
	if err != nil {
		return errors.Wrap(err, "Invalid password")
	}

	err = a.store.CreateUser(&model.User{
		ID:          uuid.New().String(),
		Username:    username,
		Email:       email,
		Password:    auth.HashPassword(password),
		MfaSecret:   "",
		AuthService: "",
		AuthData:    "",
		Props:       map[string]interface{}{},
	})
	if err != nil {
		return errors.Wrap(err, "Unable to create the new user")
	}

	return nil
}
