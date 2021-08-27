// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifylogger

import (
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/notify"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	backendName = "notifyLogger"
)

type Backend struct {
	logger *mlog.Logger
	level  mlog.Level
}

func New(logger *mlog.Logger, level mlog.Level) *Backend {
	return &Backend{
		logger: logger,
		level:  level,
	}
}

func (b *Backend) Start() error {
	return nil
}

func (b *Backend) ShutDown() error {
	_ = b.logger.Flush()
	return nil
}

func (b *Backend) BlockChanged(evt notify.Event, block *model.Block, oldBlock *model.Block) error {
	b.logger.Log(b.level, "Block change event",
		mlog.String("event", string(evt)),
		mlog.String("block_id", block.ID),
	)
	return nil
}

func (b *Backend) Name() string {
	return backendName
}
