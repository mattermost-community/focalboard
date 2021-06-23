// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {Card} from '../../../blocks/card'
import {BoardTree} from '../../../viewModel/boardTree'

const moment = require('moment')

type Props = {
    card: Card,
    boardTree?: BoardTree,
}

const LastModifiedAt = (props: Props): JSX.Element => {
    let latestBlock = props.boardTree?.allBlocks.filter((block) => block.parentId === props.card.id || block.id === props.card.id).sort((a, b) => b.updateAt - a.updateAt)[0]
    latestBlock = latestBlock || props.card

    return (
        <div className='LastModifiedAt octo-propertyvalue'>{moment(latestBlock.updateAt).format('llll')}</div>
    )
}

export default LastModifiedAt
