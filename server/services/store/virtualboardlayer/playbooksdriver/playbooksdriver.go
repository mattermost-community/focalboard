package playbooksdriver

import (
	"io"
	"net"
	"net/http"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const baseURL = "http://_"

type PlaybooksDriver struct {
	store store.Store
	client *http.Client
	socketPath string
	logger mlog.LoggerIFace
}

func New(logger mlog.LoggerIFace, socketPath string) *PlaybooksDriver {
	tr := &http.Transport{
		Dial: func(network, addr string) (net.Conn, error) {
			return net.Dial("unix", socketPath)
		},
	}

	return &PlaybooksDriver{
		logger: logger,
		socketPath: socketPath,
		client: &http.Client{Transport: tr},
	}
}

func (pd *PlaybooksDriver) Name() string {
	return "playbooks"
}

func (pd *PlaybooksDriver) SetStore(store store.Store) {
	pd.store = store
}

func (pd *PlaybooksDriver) doRequest(method, url string, data io.Reader) (*http.Response, error) {
	rq, err := http.NewRequest(method, baseURL + url, data)
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
	/*

	url := fmt.Sprintf("/blocks?boardID=%s", boardID)
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

func (pd *PlaybooksDriver) GetMembersForBoard(boardID string) ([]*model.BoardMember, error) {
	/*

	url := fmt.Sprintf("/members?boardID=%s", boardID)
	rp, err := pd.doRequest(http.MethodGet, url, strings.NewReader(""))
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
