// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Represents a user's single card subscription.
// More details about the subscription can be added here later,
// but for new we only need the card ID.
interface UserBlockSubscription {
    blockId: string
}

export {
    UserBlockSubscription,
}
