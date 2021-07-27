// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import UserProperty from '../user/user'

type Props = {
    userID: string
}

const CreatedBy = (props: Props): JSX.Element => {
    return (
        <UserProperty
            value={props.userID}
            readonly={true} // created by is an immutable property, so will always be readonly
            onChange={() => {}} // since created by is immutable, we don't need to handle onChange
        />
    )
}

export default CreatedBy
