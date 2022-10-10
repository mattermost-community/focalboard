package playbooksdriver

import (
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const baseURL = "http://localserver/"

type PlaybooksDriver struct {
	store      store.Store
	client     *http.Client
	socketPath string
	logger     mlog.LoggerIFace
}

func New(logger mlog.LoggerIFace, socketPath string) *PlaybooksDriver {
	tr := &http.Transport{
		Dial: func(network, addr string) (net.Conn, error) {
			return net.Dial("unix", socketPath)
		},
	}

	return &PlaybooksDriver{
		logger:     logger,
		socketPath: socketPath,
		client:     &http.Client{Transport: tr},
	}
}

func (pd *PlaybooksDriver) Name() string {
	return "playbooks"
}

func (pd *PlaybooksDriver) SetStore(store store.Store) {
	pd.store = store
}

func (pd *PlaybooksDriver) doRequest(method, url string, data io.Reader) (*http.Response, error) {
	rq, err := http.NewRequest(method, baseURL+url, data)
	if err != nil {
		return nil, err
	}

	// ToDo: add headers if necessary

	rp, err := pd.client.Do(rq)
	if err != nil {
		return nil, err
	}

	if err := checkResponseCode(rp); err != nil {
		return nil, err
	}

	return rp, nil
}

func (pd *PlaybooksDriver) GetBlocksForBoard(boardID string) ([]model.Block, error) {
	board, err := pd.store.GetBoard(boardID)
	if err != nil {
		return []model.Block{}, err
	}

	url := fmt.Sprintf("/boards/blocks?boardID=%s&playbookIDs=%s&teamID=%s", boardID, board.VirtualLink, board.TeamID)
	rp, err := pd.doRequest(http.MethodGet, url, strings.NewReader(""))
	if model.IsErrNotFound(err) {
		return []model.Block{}, nil
	}
	if err != nil {
		return nil, err
	}
	defer closeBody(rp)

	var blocks []model.Block
	if err := json.NewDecoder(rp.Body).Decode(&blocks); err != nil {
		return nil, err
	}

	return blocks, nil
}

func (pd *PlaybooksDriver) GetMembersForBoard(boardID string) ([]*model.BoardMember, error) {
	board, err := pd.store.GetBoard(boardID)
	if err != nil {
		return []*model.BoardMember{}, err
	}

	url := fmt.Sprintf("/boards/members?playbookIDs=%s&teamID=%s", board.VirtualLink, board.TeamID)
	rp, err := pd.doRequest(http.MethodGet, url, strings.NewReader(""))
	if model.IsErrNotFound(err) {
		return []*model.BoardMember{}, nil
	}
	if err != nil {
		return nil, err
	}
	defer closeBody(rp)

	boardMembers := make([]*model.BoardMember, 0)
	if err := json.NewDecoder(rp.Body).Decode(&boardMembers); err != nil {
		return nil, err
	}

	return boardMembers, nil
}

func (pd *PlaybooksDriver) GetVirtualLinks(userID, teamID string) ([]*model.VirtualLink, error) {
	url := fmt.Sprintf("/boards/playbooks?user_id=%s&team_id=%s", userID, teamID)
	rp, err := pd.doRequest(http.MethodGet, url, strings.NewReader(""))
	if model.IsErrNotFound(err) {
		return []*model.VirtualLink{}, nil
	}
	if err != nil {
		return nil, err
	}
	defer closeBody(rp)

	var links []*model.VirtualLink
	if err := json.NewDecoder(rp.Body).Decode(&links); err != nil {
		return nil, err
	}

	return links, nil
}
