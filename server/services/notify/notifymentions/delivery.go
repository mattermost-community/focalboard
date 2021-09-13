// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifymentions

import "github.com/mattermost/focalboard/server/services/notify"

// Delivery provides an interface for delivering notifications to other systems, such as
// MM server or email.
type Delivery interface {
	Deliver(mentionUsername string, extract string, evt notify.BlockChangeEvent) error
}
