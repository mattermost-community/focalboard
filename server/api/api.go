package api

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/mattermost/focalboard/server/app"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"
)

const (
	HEADER_REQUESTED_WITH     = "X-Requested-With"
	HEADER_REQUESTED_WITH_XML = "XMLHttpRequest"
)

// ----------------------------------------------------------------------------------------------------
// REST APIs

type API struct {
	appBuilder func() *app.App
	singleUser bool
}

func NewAPI(appBuilder func() *app.App, singleUser bool) *API {
	return &API{appBuilder: appBuilder, singleUser: singleUser}
}

func (a *API) app() *app.App {
	return a.appBuilder()
}

func (a *API) RegisterRoutes(r *mux.Router) {
	a.addHandler(r, "/api/v1/blocks", "GET", a.sessionRequired(a.handleGetBlocks))
	a.addHandler(r, "/api/v1/blocks", "POST", a.sessionRequired(a.handlePostBlocks))
	a.addHandler(r, "/api/v1/blocks/{blockID}", "DELETE", a.sessionRequired(a.handleDeleteBlock))
	a.addHandler(r, "/api/v1/blocks/{blockID}/subtree", "GET", a.attachSession(a.handleGetSubTree, false))

	a.addHandler(r, "/api/v1/users/me", "GET", a.sessionRequired(a.handleGetMe))
	a.addHandler(r, "/api/v1/users/{userID}", "GET", a.sessionRequired(a.handleGetUser))
	a.addHandler(r, "/api/v1/users/{userID}/changepassword", "POST", a.sessionRequired(a.handleChangePassword))

	a.addHandler(r, "/api/v1/login", "POST", a.sessionRequired(a.handleLogin))
	a.addHandler(r, "/api/v1/register", "POST", a.sessionRequired(a.handleRegister))

	a.addHandler(r, "api/v1/files", "POST", a.sessionRequired(a.handleUploadFile))
	a.addHandler(r, "/files/{filename}", "GET", a.sessionRequired(a.handleServeFile))

	a.addHandler(r, "/api/v1/blocks/export", "GET", a.sessionRequired(a.handleExport))
	a.addHandler(r, "/api/v1/blocks/import", "POST", a.sessionRequired(a.handleImport))

	a.addHandler(r, "/api/v1/sharing/{rootID}", "POST", a.sessionRequired(a.handlePostSharing))
	a.addHandler(r, "/api/v1/sharing/{rootID}", "GET", a.sessionRequired(a.handleGetSharing))

	a.addHandler(r, "/api/v1/workspace", "GET", a.sessionRequired(a.handleGetWorkspace))
	a.addHandler(r, "/api/v1/workspace/regenerate_signup_token", "POST", a.sessionRequired(a.handlePostWorkspaceRegenerateSignupToken))
}

func (a *API) RegisterAdminRoutes(r *mux.Router) {
	r.HandleFunc("/api/v1/admin/users/{username}/password", a.adminRequired(a.handleAdminSetPassword)).Methods("POST")
}

func (a *API) addHandler(r *mux.Router, path string, method string, f func(http.ResponseWriter, *http.Request)) {
	r.HandleFunc(path, a.preHandle(f)).Methods(method)
}

func (a *API) preHandle(handler func(w http.ResponseWriter, r *http.Request)) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		if !a.checkCSRFToken(r) {
			log.Println("checkCSRFToken FAILED")
			errorResponse(w, http.StatusBadRequest, nil, nil)
			return
		}

		handler(w, r)
	}
}

func (a *API) checkCSRFToken(r *http.Request) bool {
	token := r.Header.Get(HEADER_REQUESTED_WITH)

	if token == HEADER_REQUESTED_WITH_XML {
		return true
	}

	return false
}

func (a *API) handleGetBlocks(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	parentID := query.Get("parent_id")
	blockType := query.Get("type")

	blocks, err := a.app().GetBlocks(parentID, blockType)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	// log.Printf("GetBlocks parentID: %s, type: %s, %d result(s)", parentID, blockType, len(blocks))

	json, err := json.Marshal(blocks)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, json)
}

func stampModifiedByUser(r *http.Request, blocks []model.Block) {
	ctx := r.Context()
	session := ctx.Value("session").(*model.Session)
	userID := session.UserID
	if userID == "single-user" {
		userID = ""
	}

	for i := range blocks {
		blocks[i].ModifiedBy = userID
	}
}

func (a *API) handlePostBlocks(w http.ResponseWriter, r *http.Request) {
	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	var blocks []model.Block

	err = json.Unmarshal(requestBody, &blocks)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	for _, block := range blocks {
		// Error checking
		if len(block.Type) < 1 {
			errorData := map[string]string{"description": "missing type", "id": block.ID}
			errorResponse(w, http.StatusBadRequest, errorData, nil)
			return
		}

		if block.CreateAt < 1 {
			errorData := map[string]string{"description": "invalid createAt", "id": block.ID}
			errorResponse(w, http.StatusBadRequest, errorData, nil)
			return
		}

		if block.UpdateAt < 1 {
			errorData := map[string]string{"description": "invalid UpdateAt", "id": block.ID}
			errorResponse(w, http.StatusBadRequest, errorData, nil)
			return
		}
	}

	stampModifiedByUser(r, blocks)

	err = a.app().InsertBlocks(blocks)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	log.Printf("POST Blocks %d block(s)", len(blocks))
	jsonStringResponse(w, http.StatusOK, "{}")
}

func (a *API) handleGetUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userID"]

	user, err := a.app().GetUser(userID)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	userData, err := json.Marshal(user)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	jsonStringResponse(w, http.StatusOK, string(userData))
}

func (a *API) handleGetMe(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	session := ctx.Value("session").(*model.Session)
	var user *model.User
	var err error

	if session.UserID == "single-user" {
		now := time.Now().Unix()
		user = &model.User{
			ID:       "single-user",
			Username: "single-user",
			Email:    "single-user",
			CreateAt: now,
			UpdateAt: now,
		}
	} else {
		user, err = a.app().GetUser(session.UserID)
		if err != nil {
			errorResponse(w, http.StatusInternalServerError, nil, err)
			return
		}
	}

	userData, err := json.Marshal(user)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	jsonStringResponse(w, http.StatusOK, string(userData))
}

func (a *API) handleDeleteBlock(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	session := ctx.Value("session").(*model.Session)
	userID := session.UserID

	vars := mux.Vars(r)
	blockID := vars["blockID"]

	err := a.app().DeleteBlock(blockID, userID)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)

		return
	}

	log.Printf("DELETE Block %s", blockID)
	jsonStringResponse(w, http.StatusOK, "{}")
}

func (a *API) handleGetSubTree(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	blockID := vars["blockID"]

	// If not authenticated (no session), check that block is publicly shared
	ctx := r.Context()
	session, _ := ctx.Value("session").(*model.Session)
	if session == nil {
		query := r.URL.Query()
		readToken := query.Get("read_token")

		// Require read token
		if len(readToken) < 1 {
			errorResponse(w, http.StatusUnauthorized, map[string]string{"error": "No read_token"}, nil)
			return
		}

		rootID, err := a.app().GetRootID(blockID)
		if err != nil {
			errorResponse(w, http.StatusInternalServerError, nil, err)
			return
		}

		sharing, err := a.app().GetSharing(rootID)
		if err != nil {
			errorResponse(w, http.StatusInternalServerError, nil, err)
			return
		}

		if sharing == nil || !(sharing.ID == rootID && sharing.Enabled && sharing.Token == readToken) {
			errorResponse(w, http.StatusUnauthorized, nil, nil)
			return
		}
	}

	query := r.URL.Query()
	levels, err := strconv.ParseInt(query.Get("l"), 10, 32)
	if err != nil {
		levels = 2
	}

	if levels != 2 && levels != 3 {
		log.Printf(`ERROR Invalid levels: %d`, levels)
		errorData := map[string]string{"description": "invalid levels"}
		errorResponse(w, http.StatusInternalServerError, errorData, nil)
		return
	}

	blocks, err := a.app().GetSubTree(blockID, int(levels))
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	log.Printf("GetSubTree (%v) blockID: %s, %d result(s)", levels, blockID, len(blocks))
	json, err := json.Marshal(blocks)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, json)
}

func (a *API) handleExport(w http.ResponseWriter, r *http.Request) {
	blocks, err := a.app().GetAllBlocks()
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	log.Printf("%d raw block(s)", len(blocks))
	blocks = filterOrphanBlocks(blocks)
	log.Printf("EXPORT %d filtered block(s)", len(blocks))

	json, err := json.Marshal(blocks)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, json)
}

func filterOrphanBlocks(blocks []model.Block) (ret []model.Block) {
	queue := make([]model.Block, 0)
	var childrenOfBlockWithID = make(map[string]*[]model.Block)

	// Build the trees from nodes
	for _, block := range blocks {
		if len(block.ParentID) == 0 {
			// Queue root blocks to process first
			queue = append(queue, block)
		} else {
			siblings := childrenOfBlockWithID[block.ParentID]
			if siblings != nil {
				*siblings = append(*siblings, block)
			} else {
				siblings := []model.Block{block}
				childrenOfBlockWithID[block.ParentID] = &siblings
			}
		}
	}

	// Map the trees to an array, which skips orphaned nodes
	blocks = make([]model.Block, 0)
	for len(queue) > 0 {
		block := queue[0]
		queue = queue[1:] // dequeue
		blocks = append(blocks, block)
		children := childrenOfBlockWithID[block.ID]
		if children != nil {
			queue = append(queue, (*children)...)
		}
	}

	return blocks
}

func arrayContainsBlockWithID(array []model.Block, blockID string) bool {
	for _, item := range array {
		if item.ID == blockID {
			return true
		}
	}
	return false
}

func (a *API) handleImport(w http.ResponseWriter, r *http.Request) {
	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	var blocks []model.Block

	err = json.Unmarshal(requestBody, &blocks)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)

		return
	}

	stampModifiedByUser(r, blocks)

	err = a.app().InsertBlocks(blocks)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)

		return
	}

	log.Printf("IMPORT Blocks %d block(s)", len(blocks))
	jsonStringResponse(w, http.StatusOK, "{}")
}

// Sharing

func (a *API) handleGetSharing(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	rootID := vars["rootID"]

	sharing, err := a.app().GetSharing(rootID)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	sharingData, err := json.Marshal(sharing)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	log.Printf("GET sharing %s", rootID)
	jsonStringResponse(w, http.StatusOK, string(sharingData))
}

func (a *API) handlePostSharing(w http.ResponseWriter, r *http.Request) {
	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	var sharing model.Sharing

	err = json.Unmarshal(requestBody, &sharing)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	// Stamp ModifiedBy
	ctx := r.Context()
	session := ctx.Value("session").(*model.Session)
	userID := session.UserID
	if userID == "single-user" {
		userID = ""
	}
	sharing.ModifiedBy = userID

	err = a.app().UpsertSharing(sharing)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	log.Printf("POST sharing %s", sharing.ID)
	jsonStringResponse(w, http.StatusOK, "{}")
}

// Workspace

func (a *API) handleGetWorkspace(w http.ResponseWriter, r *http.Request) {
	workspace, err := a.app().GetRootWorkspace()
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	workspaceData, err := json.Marshal(workspace)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	jsonStringResponse(w, http.StatusOK, string(workspaceData))
}

func (a *API) handlePostWorkspaceRegenerateSignupToken(w http.ResponseWriter, r *http.Request) {
	workspace, err := a.app().GetRootWorkspace()
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	workspace.SignupToken = utils.CreateGUID()

	err = a.app().UpsertWorkspaceSignupToken(*workspace)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	jsonStringResponse(w, http.StatusOK, "{}")
}

// File upload

func (a *API) handleServeFile(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	filename := vars["filename"]

	contentType := "image/jpg"

	fileExtension := strings.ToLower(filepath.Ext(filename))
	if fileExtension == "png" {
		contentType = "image/png"
	}

	w.Header().Set("Content-Type", contentType)

	filePath := a.app().GetFilePath(filename)
	http.ServeFile(w, r, filePath)
}

func (a *API) handleUploadFile(w http.ResponseWriter, r *http.Request) {
	fmt.Println(`handleUploadFile`)

	file, handle, err := r.FormFile("file")
	if err != nil {
		fmt.Fprintf(w, "%v", err)

		return
	}
	defer file.Close()

	log.Printf(`handleUploadFile, filename: %s`, handle.Filename)

	url, err := a.app().SaveFile(file, handle.Filename)
	if err != nil {
		jsonStringResponse(w, http.StatusInternalServerError, `{}`)

		return
	}

	log.Printf(`saveFile, url: %s`, url)
	json := fmt.Sprintf(`{ "url": "%s" }`, url)
	jsonStringResponse(w, http.StatusOK, json)
}

// Response helpers

func jsonStringResponse(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	fmt.Fprint(w, message)
}

func jsonBytesResponse(w http.ResponseWriter, code int, json []byte) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(json)
}

func errorResponse(w http.ResponseWriter, code int, message map[string]string, sourceError error) {
	log.Printf("API ERROR %d, err: %v\n", code, sourceError)
	w.Header().Set("Content-Type", "application/json")
	data, err := json.Marshal(message)
	if err != nil {
		data = []byte("{}")
	}
	w.WriteHeader(code)
	w.Write(data)
}

func addUserID(rw http.ResponseWriter, req *http.Request, next http.Handler) {
	ctx := context.WithValue(req.Context(), "userid", req.Header.Get("userid"))
	req = req.WithContext(ctx)
	next.ServeHTTP(rw, req)
}
