// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifysubscriptions

// Delivery provides an interface for delivering subscription notifications to other systems, such as
// channels server via plugin API.
type Delivery interface {
	Deliver(subscriberID string, subscriberType string, markdown []string) error
}
