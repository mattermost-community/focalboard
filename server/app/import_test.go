package app

import (
	"bytes"
	"testing"

	"github.com/golang/mock/gomock"
	"github.com/mattermost/focalboard/server/model"
	"github.com/stretchr/testify/require"
)

func TestApp_ImportArchive(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	board := &model.Board{
		ID:     "d14b9df9-1f31-4732-8a64-92bc7162cd28",
		TeamID: "test-team",
		Title:  "Cross-Functional Project Plan",
	}

	block := model.Block{
		ID:       "2c1873e0-1484-407d-8b2c-3c3b5a2a9f9e",
		ParentID: board.ID,
		Type:     model.TypeView,
		BoardID:  board.ID,
	}

	babs := &model.BoardsAndBlocks{
		Boards: []*model.Board{board},
		Blocks: []model.Block{block},
	}

	boardMember := &model.BoardMember{
		BoardID: board.ID,
		UserID:  "user",
	}

	t.Run("import asana archive", func(t *testing.T) {
		r := bytes.NewReader([]byte(asana))
		opts := model.ImportArchiveOptions{
			TeamID:     "test-team",
			ModifiedBy: "user",
		}

		th.Store.EXPECT().CreateBoardsAndBlocks(gomock.AssignableToTypeOf(&model.BoardsAndBlocks{}), "user").Return(babs, nil)
		th.Store.EXPECT().GetMembersForBoard(board.ID).AnyTimes().Return([]*model.BoardMember{boardMember}, nil)
		th.Store.EXPECT().GetBoard(board.ID).Return(board, nil)
		th.Store.EXPECT().GetMemberForBoard(board.ID, "user").Return(boardMember, nil)

		err := th.App.ImportArchive(r, opts)
		require.NoError(t, err, "import archive should not fail")
	})
}

//nolint:lll
const asana = `{"version":1,"date":1614714686842}
{"type":"block","data":{"id":"d14b9df9-1f31-4732-8a64-92bc7162cd28","fields":{"icon":"","description":"","cardProperties":[{"id":"3bdcbaeb-bc78-4884-8531-a0323b74676a","name":"Section","type":"select","options":[{"id":"d8d94ef1-5e74-40bb-8be5-fc0eb3f47732","value":"Planning","color":"propColorGray"},{"id":"454559bb-b788-4ff6-873e-04def8491d2c","value":"Milestones","color":"propColorBrown"},{"id":"deaab476-c690-48df-828f-725b064dc476","value":"Next steps","color":"propColorOrange"},{"id":"2138305a-3157-461c-8bbe-f19ebb55846d","value":"Comms Plan","color":"propColorYellow"}]}]},"createAt":1614714686836,"updateAt":1614714686836,"deleteAt":0,"schema":1,"parentId":"","rootId":"d14b9df9-1f31-4732-8a64-92bc7162cd28","modifiedBy":"","type":"board","title":"Cross-Functional Project Plan"}}
{"type":"block","data":{"id":"2c1873e0-1484-407d-8b2c-3c3b5a2a9f9e","fields":{"sortOptions":[],"visiblePropertyIds":[],"visibleOptionIds":[],"hiddenOptionIds":[],"filter":{"operation":"and","filters":[]},"cardOrder":[],"columnWidths":{},"viewType":"board"},"createAt":1614714686840,"updateAt":1614714686840,"deleteAt":0,"schema":1,"parentId":"d14b9df9-1f31-4732-8a64-92bc7162cd28","rootId":"d14b9df9-1f31-4732-8a64-92bc7162cd28","modifiedBy":"","type":"view","title":"Board View"}}
{"type":"block","data":{"id":"520c332b-adf5-4a32-88ab-43655c8b6aa2","fields":{"icon":"","properties":{"3bdcbaeb-bc78-4884-8531-a0323b74676a":"d8d94ef1-5e74-40bb-8be5-fc0eb3f47732"},"contentOrder":["deb3966c-6d56-43b1-8e95-36806877ce81"]},"createAt":1614714686841,"updateAt":1614714686841,"deleteAt":0,"schema":1,"parentId":"d14b9df9-1f31-4732-8a64-92bc7162cd28","rootId":"d14b9df9-1f31-4732-8a64-92bc7162cd28","modifiedBy":"","type":"card","title":"[READ ME] - Instructions for using this template"}}
{"type":"block","data":{"id":"deb3966c-6d56-43b1-8e95-36806877ce81","fields":{},"createAt":1614714686841,"updateAt":1614714686841,"deleteAt":0,"schema":1,"parentId":"520c332b-adf5-4a32-88ab-43655c8b6aa2","rootId":"d14b9df9-1f31-4732-8a64-92bc7162cd28","modifiedBy":"","type":"text","title":"This project template is set up in List View with sections and Asana-created Custom Fields to help you track your team's work. We've provided some example content in this template to get you started, but you should add tasks, change task names, add more Custom Fields, and change any other info to make this project your own.\n\nSend feedback about this template: https://asa.na/templatesfeedback"}}
{"type":"block","data":{"id":"be791f66-a5e5-4408-82f6-cb1280f5bc45","fields":{"icon":"","properties":{"3bdcbaeb-bc78-4884-8531-a0323b74676a":"d8d94ef1-5e74-40bb-8be5-fc0eb3f47732"},"contentOrder":["2688b31f-e7ff-4de1-87ae-d4b5570f8712"]},"createAt":1614714686841,"updateAt":1614714686841,"deleteAt":0,"schema":1,"parentId":"d14b9df9-1f31-4732-8a64-92bc7162cd28","rootId":"d14b9df9-1f31-4732-8a64-92bc7162cd28","modifiedBy":"","type":"card","title":"Redesign the landing page of our website"}}
{"type":"block","data":{"id":"2688b31f-e7ff-4de1-87ae-d4b5570f8712","fields":{},"createAt":1614714686841,"updateAt":1614714686841,"deleteAt":0,"schema":1,"parentId":"be791f66-a5e5-4408-82f6-cb1280f5bc45","rootId":"d14b9df9-1f31-4732-8a64-92bc7162cd28","modifiedBy":"","type":"text","title":"Redesign the landing page to focus on the main persona."}}
{"type":"block","data":{"id":"98f74948-1700-4a3c-8cc2-8bb632499def","fields":{"icon":"","properties":{"3bdcbaeb-bc78-4884-8531-a0323b74676a":"454559bb-b788-4ff6-873e-04def8491d2c"},"contentOrder":[]},"createAt":1614714686841,"updateAt":1614714686841,"deleteAt":0,"schema":1,"parentId":"d14b9df9-1f31-4732-8a64-92bc7162cd28","rootId":"d14b9df9-1f31-4732-8a64-92bc7162cd28","modifiedBy":"","type":"card","title":"[EXAMPLE TASK] Consider trying a new email marketing service"}}
{"type":"block","data":{"id":"142fba5d-05e6-4865-83d9-b3f54d9de96e","fields":{"icon":"","properties":{"3bdcbaeb-bc78-4884-8531-a0323b74676a":"454559bb-b788-4ff6-873e-04def8491d2c"},"contentOrder":[]},"createAt":1614714686841,"updateAt":1614714686841,"deleteAt":0,"schema":1,"parentId":"d14b9df9-1f31-4732-8a64-92bc7162cd28","rootId":"d14b9df9-1f31-4732-8a64-92bc7162cd28","modifiedBy":"","type":"card","title":"[EXAMPLE TASK] Budget finalization"}}
{"type":"block","data":{"id":"ca6670b1-b034-4e42-8971-c659b478b9e0","fields":{"icon":"","properties":{"3bdcbaeb-bc78-4884-8531-a0323b74676a":"deaab476-c690-48df-828f-725b064dc476"},"contentOrder":[]},"createAt":1614714686841,"updateAt":1614714686841,"deleteAt":0,"schema":1,"parentId":"d14b9df9-1f31-4732-8a64-92bc7162cd28","rootId":"d14b9df9-1f31-4732-8a64-92bc7162cd28","modifiedBy":"","type":"card","title":"[EXAMPLE TASK] Find a venue for the holiday party"}}
{"type":"block","data":{"id":"db1dd596-0999-4741-8b05-72ca8e438e31","fields":{"icon":"","properties":{"3bdcbaeb-bc78-4884-8531-a0323b74676a":"deaab476-c690-48df-828f-725b064dc476"},"contentOrder":[]},"createAt":1614714686841,"updateAt":1614714686841,"deleteAt":0,"schema":1,"parentId":"d14b9df9-1f31-4732-8a64-92bc7162cd28","rootId":"d14b9df9-1f31-4732-8a64-92bc7162cd28","modifiedBy":"","type":"card","title":"[EXAMPLE TASK] Approve campaign copy"}}
{"type":"block","data":{"id":"16861c05-f31f-46af-8429-80a87b5aa93a","fields":{"icon":"","properties":{"3bdcbaeb-bc78-4884-8531-a0323b74676a":"2138305a-3157-461c-8bbe-f19ebb55846d"},"contentOrder":[]},"createAt":1614714686841,"updateAt":1614714686841,"deleteAt":0,"schema":1,"parentId":"d14b9df9-1f31-4732-8a64-92bc7162cd28","rootId":"d14b9df9-1f31-4732-8a64-92bc7162cd28","modifiedBy":"","type":"card","title":"[EXAMPLE TASK] Send out updated attendee list"}}
`
