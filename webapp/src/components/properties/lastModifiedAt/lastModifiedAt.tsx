// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useContext} from 'react'

import {CardTree, CardTreeContext} from '../../../viewModel/cardTree'

const moment = require('moment')

const LastModifiedAt = (): JSX.Element => {
    const cardTree = useContext<CardTree | undefined>(CardTreeContext)

    return (
        <div className='LastModifiedAt octo-propertyvalue'>{moment(cardTree?.latestBlock.updateAt).format('llll')}</div>
    )
}

export default LastModifiedAt
