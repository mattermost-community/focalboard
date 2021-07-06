// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

const moment = require('moment')

type Props = {
    createAt: number
}

const CreatedAt = (props: Props): JSX.Element => {
    return (
        <div className='CreatedAt octo-propertyvalue'>
            {moment(props.createAt).format('llll')}
        </div>
    )
}

export default CreatedAt
