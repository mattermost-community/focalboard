package api

import (
	"context"
	"encoding/json"
	"errors"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/mattermost/mattermost-octo-tasks/server/model"
	"github.com/mattermost/mattermost-octo-tasks/server/services/auth"
)

type LoginData struct {
	Type     string `json:"type"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
	MfaToken string `json:"mfa_token"`
}

type RegisterData struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Token    string `json:"token"`
}

func (rd *RegisterData) IsValid() error {
	if rd.Username == "" {
		return errors.New("Username is required")
	}
	if rd.Email == "" {
		return errors.New("Email is required")
	}
	if !strings.Contains(rd.Email, "@") {
		return errors.New("Invalid email format")
	}
	if !strings.Contains(rd.Password, "") {
		return errors.New("Password is required")
	}
	return nil
}

func (a *API) handleLogin(w http.ResponseWriter, r *http.Request) {
	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil)

		return
	}

	var loginData LoginData
	err = json.Unmarshal(requestBody, &loginData)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil)
		return
	}

	if loginData.Type == "normal" {
		token, err := a.app().Login(loginData.Username, loginData.Email, loginData.Password, loginData.MfaToken)
		if err != nil {
			errorResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		json, err := json.Marshal(map[string]string{"token": token})
		if err != nil {
			log.Printf(`ERROR json.Marshal: %v`, r)
			errorResponse(w, http.StatusInternalServerError, nil)
			return
		}

		jsonBytesResponse(w, http.StatusOK, json)
		return
	}

	errorResponse(w, http.StatusInternalServerError, map[string]string{"error": "Unknown login type"})
}

func (a *API) handleRegister(w http.ResponseWriter, r *http.Request) {
	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil)
		return
	}

	var registerData RegisterData
	err = json.Unmarshal(requestBody, &registerData)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil)
		return
	}

	// Validate token
	if len(registerData.Token) > 0 {
		workspace, err := a.app().GetRootWorkspace()
		if err != nil {
			log.Println("ERROR: Unable to get active user count", err)
			errorResponse(w, http.StatusInternalServerError, nil)
			return
		}

		if registerData.Token != workspace.SignupToken {
			errorResponse(w, http.StatusUnauthorized, nil)
			return
		}
	} else {
		// No signup token, check if no active users
		userCount, err := a.app().GetActiveUserCount()
		if err != nil {
			log.Println("ERROR: Unable to get active user count", err)
			errorResponse(w, http.StatusInternalServerError, nil)
			return
		}
		if userCount > 0 {
			errorResponse(w, http.StatusUnauthorized, nil)
			return
		}
	}

	if err = registerData.IsValid(); err != nil {
		errorResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	err = a.app().RegisterUser(registerData.Username, registerData.Email, registerData.Password)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	jsonBytesResponse(w, http.StatusOK, nil)
}

func (a *API) sessionRequired(handler func(w http.ResponseWriter, r *http.Request)) func(w http.ResponseWriter, r *http.Request) {
	return a.attachSession(handler, true)
}

func (a *API) attachSession(handler func(w http.ResponseWriter, r *http.Request), required bool) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Printf(`Single User: %v`, a.singleUser)
		if a.singleUser {
			now := time.Now().Unix()
			session := &model.Session{
				ID:       "single-user",
				Token:    "single-user",
				UserID:   "single-user",
				CreateAt: now,
				UpdateAt: now,
			}
			ctx := context.WithValue(r.Context(), "session", session)
			handler(w, r.WithContext(ctx))
			return
		}

		token, _ := auth.ParseAuthTokenFromRequest(r)
		session, err := a.app().GetSession(token)
		if err != nil {
			if required {
				errorResponse(w, http.StatusUnauthorized, map[string]string{"error": err.Error()})
				return
			}

			handler(w, r)
			return
		}
		ctx := context.WithValue(r.Context(), "session", session)
		handler(w, r.WithContext(ctx))
	}
}
