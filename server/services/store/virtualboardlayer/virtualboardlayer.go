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
	GetVirtualLinks(userID, teamID string) ([]*model.VirtualLink, error)
}

// Store represents the abstraction of the data storage.
type VirtualBoardLayer struct {
	store.Store
	logger  mlog.LoggerIFace
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

func (vbl *VirtualBoardLayer) getDriver(name string) (VirtualBoardDriver, error) {
	driver, ok := vbl.drivers[name]
	if !ok {
		return nil, NewErrDriverNotFound(name)
	}

	return driver, nil
}

func (vbl *VirtualBoardLayer) getDriverForBoard(id string) (VirtualBoardDriver, error) {
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

	return vbl.getDriver(board.VirtualDriver)
}

func (vbl *VirtualBoardLayer) GetBlocksForBoard(boardID string) ([]model.Block, error) {
	storeBlocks, err := vbl.Store.GetBlocksForBoard(boardID)
	if err != nil {
		return nil, err
	}

	driver, err := vbl.getDriverForBoard(boardID)
	if err != nil {
		return nil, err
	}
	if driver == nil {
		vbl.logger.Debug("Got nil driver on GetBlocksForBoard",
			mlog.String("boardID", boardID),
		)
		return storeBlocks, nil
	}
	vbl.logger.Debug("Got driver on GetBlocksForBoard",
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
	driver, err := vbl.getDriverForBoard(boardID)
	if err != nil {
		return nil, err
	}
	if driver == nil {
		vbl.logger.Debug("Got nil driver on GetMembersForBoard",
			mlog.String("boardID", boardID),
		)
		return vbl.Store.GetMembersForBoard(boardID)
	}

	vbl.logger.Debug("Got driver on GetMembersForBoard",
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

	processedMembers := make([]*model.BoardMember, 0)
	for _, member := range members {
		newMember := &model.BoardMember{
			BoardID:      boardID,
			UserID:       member.UserID,
			Roles:        "",
			MinimumRole:  "viewer",
			SchemeViewer: true,
		}
		processedMembers = append(processedMembers, newMember)
	}

	return processedMembers, nil
}

func (vbl *VirtualBoardLayer) GetVirtualLinksForDriver(driverName, userID, teamID string) ([]*model.VirtualLink, error) {
	driver, err := vbl.getDriver(driverName)
	if err != nil {
		return nil, err
	}

	vbl.logger.Debug("Got driver for GetVirtualLinksForDriver",
		mlog.String("driver", driverName),
		mlog.String("userID", userID),
		mlog.String("teamID", teamID),
	)
	links, err := driver.GetVirtualLinks(userID, teamID)
	if err != nil {
		return nil, err
	}

	vbl.logger.Debug("Got virtual links on GetVirtualLinksForDriver from virtual store driver",
		mlog.String("driver", driverName),
		mlog.String("userID", userID),
		mlog.String("teamID", teamID),
		mlog.Int("virtualLinksCount", len(links)),
	)
	return links, nil
}
