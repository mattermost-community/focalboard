package app

import (
	"github.com/google/uuid"
	"github.com/mattermost/mattermost-octo-tasks/server/model"
	"github.com/mattermost/mattermost-octo-tasks/server/services/auth"

	"github.com/pkg/errors"
)

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
		return "", errors.New("invalid username or password")
	}

	// TODO: MFA verification
	return auth.CreateToken(user.ID, a.config.Secret)
}

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
