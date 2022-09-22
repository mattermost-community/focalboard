package playbooksstorelayer

import (
	"fmt"
	"io"
	"net/http"

	"github.com/mattermost/focalboard/server/model"
)

func closeBody(rp *http.Response) {
	if rp.Body != nil {
		_, _ = io.Copy(io.Discard, rp.Body)
		_ = rp.Body.Close()
	}
}

func isPlaybooksVirtualBoard(board *model.Board) bool {
	// ToDo: create a const for this
	return board.VirtualDriver == "playbooks"
}

func checkResponseCode(rp *http.Response) error {
	if rp.StatusCode != http.StatusOK {
		return fmt.Errorf("error response status %d", rp.StatusCode)
	}
	return nil
}
