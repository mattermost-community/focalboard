// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {Card} from '../../../blocks/card'
import {CardTree} from '../../../viewModel/cardTree'
import {IBlock} from '../../../blocks/block'

const moment = require('moment')

type Props = {
    card: Card,
    cardTree?: CardTree
}

const LastModifiedAt = (props: Props): JSX.Element => {
    let latestBlock: IBlock = props.card
    if (props.cardTree) {
        const sortedBlocks = props.cardTree.allBlocks.
            filter((block) => block.parentId === props.card.id || block.id === props.card.id).
            sort((a, b) => b.updateAt - a.updateAt)

        latestBlock = sortedBlocks.length > 0 ? sortedBlocks[0] : latestBlock
    }

    return (
        <div className='LastModifiedAt octo-propertyvalue'>
            {moment(latestBlock.updateAt).format('llll')}
        </div>
    )
}

export default LastModifiedAt
