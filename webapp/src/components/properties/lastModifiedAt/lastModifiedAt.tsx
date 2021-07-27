// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {useIntl} from 'react-intl'

import {Card} from '../../../blocks/card'
import {CardTree} from '../../../viewModel/cardTree'
import {IBlock} from '../../../blocks/block'
import {Utils} from '../../../utils'

type Props = {
    card: Card,
    cardTree?: CardTree
}

const LastModifiedAt = (props: Props): JSX.Element => {
    const intl = useIntl()

    let latestBlock: IBlock = props.card
    if (props.cardTree) {
        const sortedBlocks = props.cardTree.allBlocks.
            filter((block) => block.parentId === props.card.id || block.id === props.card.id).
            sort((a, b) => b.updateAt - a.updateAt)

        latestBlock = sortedBlocks.length > 0 ? sortedBlocks[0] : latestBlock
    }

    return (
        <div className='LastModifiedAt octo-propertyvalue'>
            {Utils.displayDateTime(new Date(latestBlock.updateAt), intl)}
        </div>
    )
}

export default LastModifiedAt
