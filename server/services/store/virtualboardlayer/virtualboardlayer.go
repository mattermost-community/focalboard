package virtualboardlayer

import (
	"fmt"
	"strings"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

type ErrDriverNotFound struct {
	name string
}

func (dnf *ErrDriverNotFound) Error() string {
	return fmt.Sprintf("virtualboard driver %s not found", dnf.name)
}

func NewErrDriverNotFound(name string) *ErrDriverNotFound {
	return &ErrDriverNotFound{
		name: name,
	}
}

type VirtualBoardDriver interface {
	Name() string
	SetStore(store store.Store)
	GetBlocksForBoard(boardID string) ([]model.Block, error)
	GetMembersForBoard(boardID string) ([]*model.BoardMember, error)
}

// Store represents the abstraction of the data storage.
type VirtualBoardLayer struct {
	store.Store
	logger mlog.LoggerIFace
	drivers map[string]VirtualBoardDriver
}

// New creates a new SQL implementation of the store.
func New(store store.Store, logger mlog.LoggerIFace, drivers map[string]VirtualBoardDriver) *VirtualBoardLayer {
	for _, driver := range drivers {
		driver.SetStore(store)
	}

	layer := &VirtualBoardLayer{
		Store:   store,
		logger:  logger,
		drivers: drivers,
	}

	return layer
}

func (vbl *VirtualBoardLayer) getDriver(id string) (VirtualBoardDriver, error) {
	// ToDo: make it a const
	// if the board ID is not a virtual one, do not go to the database
	// to check the driver name
	if !strings.HasPrefix(id, "B") {
		return nil, nil
	}

	board, err := vbl.Store.GetBoard(id)
	if err != nil {
		vbl.logger.Error("error fetching board to get driver", mlog.String("boardID", id), mlog.Err(err))
		return nil, err
	}

	if board.VirtualDriver == "" {
		return nil, nil
	}

	driver, ok := vbl.drivers[board.VirtualDriver]
	if !ok {
		return nil, NewErrDriverNotFound(board.VirtualDriver)
	}

	return driver, nil
}

func (vbl *VirtualBoardLayer) GetBlocksForBoard(boardID string) ([]model.Block, error) {
	storeBlocks, err := vbl.Store.GetBlocksForBoard(boardID)
	if err != nil {
		return nil, err
	}

	driver, err := vbl.getDriver(boardID)
	if err != nil {
		return nil, err
	}
	vbl.logger.Debug("Got driver on GetBlocksForBoard",
		mlog.String("driver", driver.Name()),
		mlog.String("boardID", boardID),
	)
	if driver == nil {
		return storeBlocks, nil
	}
	vbl.logger.Debug("Routing GetBlocksForBoard to virtual store driver",
		mlog.String("driver", driver.Name()),
		mlog.String("boardID", boardID),
	)
	driverBlocks, err := driver.GetBlocksForBoard(boardID)
	if err != nil {
		return nil, err
	}
	vbl.logger.Debug("Got blocks on GetBlocksForBoard from virtual store driver",
		mlog.String("driver", driver.Name()),
		mlog.String("boardID", boardID),
		mlog.Int("driverBlocks", len(driverBlocks)),
	)

	return append(storeBlocks, driverBlocks...), nil
}

func (vbl *VirtualBoardLayer) GetMembersForBoard(boardID string) ([]*model.BoardMember, error) {
	driver, err := vbl.getDriver(boardID)
	if err != nil {
		return nil, err
	}
	vbl.logger.Debug("Got driver on GetMembersForBoard",
		mlog.String("driver", driver.Name()),
		mlog.String("boardID", boardID),
	)
	if driver == nil {
		return vbl.Store.GetMembersForBoard(boardID)
	}

	vbl.logger.Debug("Routing GetMembersForBoard to virtual store driver",
		mlog.String("driver", driver.Name()),
		mlog.String("boardID", boardID),
	)
	members, err := driver.GetMembersForBoard(boardID)
	if err != nil {
		return nil, err
	}
	vbl.logger.Debug("Got members on GetMembersForBoard from virtual store driver",
		mlog.String("driver", driver.Name()),
		mlog.String("boardID", boardID),
		mlog.Int("memberCount", len(members)),
	)

	processedMembers := make([]*model.BoardMember, len(members))
	for _, member := range members {
		newMember := &model.BoardMember{
			BoardID: member.BoardID,
			UserID: member.UserID,
			Roles: "",
			MinimumRole: "viewer",
			SchemeViewer: true,
		}
		processedMembers = append(processedMembers, newMember)
	}

	return processedMembers, nil
}
