package api

import (
	"context"
	"encoding/json"
	"errors"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/mux"
	serverContext "github.com/mattermost/focalboard/server/context"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/auth"
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
	if rd.Password == "" {
		return errors.New("Password is required")
	}
	if err := isValidPassword(rd.Password); err != nil {
		return err
	}
	return nil
}

type ChangePasswordData struct {
	OldPassword string `json:"oldPassword"`
	NewPassword string `json:"newPassword"`
}

func (rd *ChangePasswordData) IsValid() error {
	if rd.OldPassword == "" {
		return errors.New("Old password is required")
	}
	if rd.NewPassword == "" {
		return errors.New("New password is required")
	}
	if err := isValidPassword(rd.NewPassword); err != nil {
		return err
	}

	return nil
}

func isValidPassword(password string) error {
	if len(password) < 8 {
		return errors.New("Password must be at least 8 characters")
	}
	return nil
}

func (a *API) handleLogin(w http.ResponseWriter, r *http.Request) {
	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	var loginData LoginData
	err = json.Unmarshal(requestBody, &loginData)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	if loginData.Type == "normal" {
		token, err := a.app().Login(loginData.Username, loginData.Email, loginData.Password, loginData.MfaToken)
		if err != nil {
			errorResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()}, err)
			return
		}
		json, err := json.Marshal(map[string]string{"token": token})
		if err != nil {
			errorResponse(w, http.StatusInternalServerError, nil, err)
			return
		}

		jsonBytesResponse(w, http.StatusOK, json)
		return
	}

	errorResponse(w, http.StatusInternalServerError, map[string]string{"error": "Unknown login type"}, nil)
}

func (a *API) handleRegister(w http.ResponseWriter, r *http.Request) {
	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	var registerData RegisterData
	err = json.Unmarshal(requestBody, &registerData)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	// Validate token
	if len(registerData.Token) > 0 {
		workspace, err := a.app().GetRootWorkspace()
		if err != nil {
			errorResponse(w, http.StatusInternalServerError, nil, err)
			return
		}

		if registerData.Token != workspace.SignupToken {
			errorResponse(w, http.StatusUnauthorized, nil, nil)
			return
		}
	} else {
		// No signup token, check if no active users
		userCount, err := a.app().GetActiveUserCount()
		if err != nil {
			errorResponse(w, http.StatusInternalServerError, nil, err)
			return
		}
		if userCount > 0 {
			errorResponse(w, http.StatusUnauthorized, nil, nil)
			return
		}
	}

	if err = registerData.IsValid(); err != nil {
		errorResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()}, err)
		return
	}

	err = a.app().RegisterUser(registerData.Username, registerData.Email, registerData.Password)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()}, err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, nil)
}

func (a *API) handleChangePassword(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userID"]

	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	var requestData ChangePasswordData
	if err := json.Unmarshal(requestBody, &requestData); err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	if err = requestData.IsValid(); err != nil {
		errorResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()}, err)
		return
	}

	if err = a.app().ChangePassword(userID, requestData.OldPassword, requestData.NewPassword); err != nil {
		errorResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()}, err)
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
				errorResponse(w, http.StatusUnauthorized, map[string]string{"error": err.Error()}, err)
				return
			}

			handler(w, r)
			return
		}
		ctx := context.WithValue(r.Context(), "session", session)
		handler(w, r.WithContext(ctx))
	}
}

func (a *API) adminRequired(handler func(w http.ResponseWriter, r *http.Request)) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		// Currently, admin APIs require local unix connections
		conn := serverContext.GetContextConn(r)
		if _, isUnix := conn.(*net.UnixConn); !isUnix {
			errorResponse(w, http.StatusUnauthorized, nil, nil)
			return
		}

		handler(w, r)
		return
	}
}
