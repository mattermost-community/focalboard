// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifysubscriptions

import "github.com/mattermost/focalboard/server/services/notify"

// Delivery provides an interface for delivering subscription notifications to other systems, such as
// channels server via plugin API.
type Delivery interface {
	Deliver(evt notify.BlockChangeEvent) error
}
