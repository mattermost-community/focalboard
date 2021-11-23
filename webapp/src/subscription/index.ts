// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Represents a user's single card subscription.
// More details about the subscription can be added here later,
// but for new we only need the card ID.
interface UserBlockSubscription {
    block_type: string
    block_id: string
    workspace_id: string
    subscriber_type: string
    subscriber_id: string
    notified_at?: number
    create_at: number
    delete_at: number
}

export {
    UserBlockSubscription,
}
