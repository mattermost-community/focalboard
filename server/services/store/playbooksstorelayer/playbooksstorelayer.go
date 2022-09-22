package playbooksstorelayer

import (
	"io"
	"net"
	"net/http"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const baseURL = "http://_"

type PlaybooksStoreLayer struct {
	store.Store
	client *http.Client
	socketPath string
	logger mlog.LoggerIFace
}

func New(store store.Store, logger mlog.LoggerIFace, socketPath string) *PlaybooksStoreLayer {
	tr := &http.Transport{
		Dial: func(network, addr string) (net.Conn, error) {
			return net.Dial("unix", socketPath)
		},
	}

	return &PlaybooksStoreLayer{
		Store: store,
		logger: logger,
		socketPath: socketPath,
		client: &http.Client{Transport: tr},
	}
}

func (s *PlaybooksStoreLayer) doRequest(method, url string, data io.Reader) (*http.Response, error) {
	rq, err := http.NewRequest(method, baseURL + url, data)
	if err != nil {
		return nil, err
	}

	// ToDo: add headers if necessary

	rp, err := s.client.Do(rq)
	if err != nil {
		return nil, err
	}

	if err := checkResponseCode(rp); err != nil {
		return nil, err
	}

	return rp, nil
}

func (s *PlaybooksStoreLayer) isPlaybooksVirtualBoardID(boardID string) bool {
	board, err := s.GetBoard(boardID)
	if err != nil {
		s.logger.Error("isPlabooksVirtualBoardID error getting board", mlog.String("boardID", boardID), mlog.Err(err))
		return false
	}

	return isPlaybooksVirtualBoard(board)
}

func (s *PlaybooksStoreLayer) GetBlocksForBoard(boardID string) ([]model.Block, error) {
	if !s.isPlaybooksVirtualBoardID(boardID) {
		return s.Store.GetBlocksForBoard(boardID)
	}

	/*

	url := fmt.Sprintf("/blocks?boardID=%s", boardID)
	rp, err := s.doRequest(http.MethodGet, url, strings.NewReader(""))
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

	*/

	blocks := []model.Block{
		{
			ID: "1",
			ParentID: "1",
			CreatedBy: "xz65wtimjpgn5mto9x6s5penmw",
			ModifiedBy: "xz65wtimjpgn5mto9x6s5penmw",
			Schema: 1,
			Type: model.TypeView,
			Title: "Board View",
			Fields: map[string]any{
				"cardOrder": []string{"2"},
				"collapsedOptionIds": []string{},
				"columnCalculations":map[string]any{},
				"columnWidths": map[string]any{},
				"defaultTemplateId":"",
				"filter": map[string]any{
					"filters": []string{},
					"operation":"and",
				},
				"hiddenOptionIds": []string{},
				"kanbanCalculations": map[string]any{},
				"sortOptions": []string{},
				"viewType":"board",
				"visibleOptionIds": []string{},
				"visiblePropertyIds": []string{},
			},
			CreateAt: 123,
			BoardID: "Brj3yfo5ojbdbbbrmt9i5nzbhge",
		},
		{
			ID: "2",
			ParentID: "2",
			CreatedBy: "xz65wtimjpgn5mto9x6s5penmw",
			ModifiedBy: "xz65wtimjpgn5mto9x6s5penmw",
			Schema: 1,
			Type: model.TypeCard,
			Title: "Hello world",
			Fields: map[string]any{
				"contentOrder": []string{},
				"icon": "🚚",
				"isTemplate": false,
				"properties": map[string]any{},
			},
			CreateAt: 123,
			BoardID: "Brj3yfo5ojbdbbbrmt9i5nzbhge",
			DeleteAt: 0,
		},
	}

	return blocks, nil
}

func (s *PlaybooksStoreLayer) GetMembersForBoard(boardID string) ([]*model.BoardMember, error) {
	if !s.isPlaybooksVirtualBoardID(boardID) {
		return s.Store.GetMembersForBoard(boardID)
	}

	/*

	url := fmt.Sprintf("/members?boardID=%s", boardID)
	rp, err := s.doRequest(http.MethodGet, url, strings.NewReader(""))
	if model.IsErrNotFound(err) {
		return []*model.BoardMember{}, nil
	}
	if err != nil {
		return nil, err
	}
	defer closeBody(rp)

	var boardMembers []*model.BoardMember
	if err := json.NewDecoder(rp.Body).Decode(&boardMembers); err != nil {
		return nil, err
	}

	*/

	boardMembers := []*model.BoardMember{
		{
			BoardID: "Brj3yfo5ojbdbbbrmt9i5nzbhge",
			UserID: "xz65wtimjpgn5mto9x6s5penmw",
			Roles: "",
			MinimumRole: "viewer",
			SchemeViewer: true,
			Synthetic: true,
		},
	}

	return boardMembers, nil
}
