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

// LoginRequest is a login request
// swagger:model
type LoginRequest struct {
	// Type of login, currently must be set to "normal"
	// required: true
	Type string `json:"type"`

	// If specified, login using username
	// required: false
	Username string `json:"username"`

	// If specified, login using email
	// required: false
	Email string `json:"email"`

	// Password
	// required: true
	Password string `json:"password"`

	// MFA token
	// required: false
	// swagger:ignore
	MfaToken string `json:"mfa_token"`
}

// LoginResponse is a login response
// swagger:model
type LoginResponse struct {
	// Session token
	// required: true
	Token string `json:"token"`
}

// RegisterRequest is a user registration request
// swagger:model
type RegisterRequest struct {
	// User name
	// required: true
	Username string `json:"username"`

	// User's email
	// required: true
	Email string `json:"email"`

	// Password
	// required: true
	Password string `json:"password"`

	// Registration authorization token
	// required: true
	Token string `json:"token"`
}

func (rd *RegisterRequest) IsValid() error {
	if strings.TrimSpace(rd.Username) == "" {
		return errors.New("username is required")
	}
	if strings.TrimSpace(rd.Email) == "" {
		return errors.New("email is required")
	}
	if !auth.IsEmailValid(rd.Email) {
		return errors.New("invalid email format")
	}
	if rd.Password == "" {
		return errors.New("password is required")
	}
	if err := isValidPassword(rd.Password); err != nil {
		return err
	}
	return nil
}

// ChangePasswordRequest is a user password change request
// swagger:model
type ChangePasswordRequest struct {
	// Old password
	// required: true
	OldPassword string `json:"oldPassword"`

	// New password
	// required: true
	NewPassword string `json:"newPassword"`
}

// IsValid validates a password change request
func (rd *ChangePasswordRequest) IsValid() error {
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
	// swagger:operation POST /api/v1/login login
	//
	// Login user
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: body
	//   in: body
	//   description: Login request
	//   required: true
	//   schema:
	//     "$ref": "#/definitions/LoginRequest"
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       "$ref": "#/definitions/LoginResponse"
	//   '401':
	//     description: invalid login
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"
	//   '500':
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	if len(a.singleUserToken) > 0 {
		// Not permitted in single-user mode
		errorResponse(w, http.StatusUnauthorized, "", nil)
		return
	}

	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "", err)
		return
	}

	var loginData LoginRequest
	err = json.Unmarshal(requestBody, &loginData)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "", err)
		return
	}

	if loginData.Type == "normal" {
		token, err := a.app().Login(loginData.Username, loginData.Email, loginData.Password, loginData.MfaToken)
		if err != nil {
			errorResponse(w, http.StatusUnauthorized, "incorrect login", err)
			return
		}
		json, err := json.Marshal(LoginResponse{Token: token})
		if err != nil {
			errorResponse(w, http.StatusInternalServerError, "", err)
			return
		}

		jsonBytesResponse(w, http.StatusOK, json)
		return
	}

	errorResponse(w, http.StatusBadRequest, "invalid login type", nil)
}

func (a *API) handleRegister(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /api/v1/register register
	//
	// Register new user
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: body
	//   in: body
	//   description: Register request
	//   required: true
	//   schema:
	//     "$ref": "#/definitions/RegisterRequest"
	// responses:
	//   '200':
	//     description: success
	//   '401':
	//     description: invalid registration token
	//   '500':
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	if len(a.singleUserToken) > 0 {
		// Not permitted in single-user mode
		errorResponse(w, http.StatusUnauthorized, "", nil)
		return
	}

	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "", err)
		return
	}

	var registerData RegisterRequest
	err = json.Unmarshal(requestBody, &registerData)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "", err)
		return
	}

	// Validate token
	if len(registerData.Token) > 0 {
		workspace, err := a.app().GetRootWorkspace()
		if err != nil {
			errorResponse(w, http.StatusInternalServerError, "", err)
			return
		}

		if registerData.Token != workspace.SignupToken {
			errorResponse(w, http.StatusUnauthorized, "", nil)
			return
		}
	} else {
		// No signup token, check if no active users
		userCount, err := a.app().GetRegisteredUserCount()
		if err != nil {
			errorResponse(w, http.StatusInternalServerError, "", err)
			return
		}
		if userCount > 0 {
			errorResponse(w, http.StatusUnauthorized, "", nil)
			return
		}
	}

	if err = registerData.IsValid(); err != nil {
		errorResponse(w, http.StatusBadRequest, err.Error(), err)
		return
	}

	err = a.app().RegisterUser(registerData.Username, registerData.Email, registerData.Password)
	if err != nil {
		errorResponse(w, http.StatusBadRequest, err.Error(), err)
		return
	}

	jsonStringResponse(w, http.StatusOK, "{}")
}

func (a *API) handleChangePassword(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /api/v1/users/{userID}/changepassword changePassword
	//
	// Change a user's password
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: userID
	//   in: path
	//   description: User ID
	//   required: true
	//   type: string
	// - name: body
	//   in: body
	//   description: Change password request
	//   required: true
	//   schema:
	//     "$ref": "#/definitions/ChangePasswordRequest"
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//   '400':
	//     description: invalid request
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"
	//   '500':
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	if len(a.singleUserToken) > 0 {
		// Not permitted in single-user mode
		errorResponse(w, http.StatusUnauthorized, "", nil)
		return
	}

	vars := mux.Vars(r)
	userID := vars["userID"]

	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "", err)
		return
	}

	var requestData ChangePasswordRequest
	if err := json.Unmarshal(requestBody, &requestData); err != nil {
		errorResponse(w, http.StatusInternalServerError, "", err)
		return
	}

	if err = requestData.IsValid(); err != nil {
		errorResponse(w, http.StatusBadRequest, err.Error(), err)
		return
	}

	if err = a.app().ChangePassword(userID, requestData.OldPassword, requestData.NewPassword); err != nil {
		errorResponse(w, http.StatusBadRequest, err.Error(), err)
		return
	}

	jsonStringResponse(w, http.StatusOK, "{}")
}

func (a *API) sessionRequired(handler func(w http.ResponseWriter, r *http.Request)) func(w http.ResponseWriter, r *http.Request) {
	return a.attachSession(handler, true)
}

func (a *API) attachSession(handler func(w http.ResponseWriter, r *http.Request), required bool) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		token, _ := auth.ParseAuthTokenFromRequest(r)

		log.Printf(`Single User: %v`, len(a.singleUserToken) > 0)
		if len(a.singleUserToken) > 0 {
			if required && (token != a.singleUserToken) {
				errorResponse(w, http.StatusUnauthorized, "", nil)
				return
			}

			now := time.Now().Unix()
			session := &model.Session{
				ID:       "single-user",
				Token:    token,
				UserID:   "single-user",
				CreateAt: now,
				UpdateAt: now,
			}
			ctx := context.WithValue(r.Context(), "session", session)
			handler(w, r.WithContext(ctx))
			return
		}

		session, err := a.app().GetSession(token)
		if err != nil {
			if required {
				errorResponse(w, http.StatusUnauthorized, "", err)
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
			errorResponse(w, http.StatusUnauthorized, "", nil)
			return
		}

		handler(w, r)
		return
	}
}
