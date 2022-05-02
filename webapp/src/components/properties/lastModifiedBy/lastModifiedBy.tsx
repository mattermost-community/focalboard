// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {Card} from '../../../blocks/card'
import {Board} from '../../../blocks/board'
import {Block} from '../../../blocks/block'
import {useAppSelector} from '../../../store/hooks'
import {getLastCardContent} from '../../../store/contents'
import {getLastCardComment} from '../../../store/comments'
import UserProperty from '../user/user'

type Props = {
    card: Card,
    board?: Board,
}

const LastModifiedBy = (props: Props): JSX.Element => {
    const lastContent = useAppSelector(getLastCardContent(props.card.id || '')) as Block
    const lastComment = useAppSelector(getLastCardComment(props.card.id)) as Block

    let latestBlock: Block = props.card
    if (props.board) {
        const allBlocks: Block[] = [props.card, lastContent, lastComment]
        const sortedBlocks = allBlocks.sort((a, b) => b.updateAt - a.updateAt)

        latestBlock = sortedBlocks.length > 0 ? sortedBlocks[0] : latestBlock
    }

    return (
        <UserProperty
            value={latestBlock.modifiedBy}
            readonly={true} // created by is an immutable property, so will always be readonly
            onChange={() => { }} // since created by is immutable, we don't need to handle onChange
        />
    )
}

export default LastModifiedBy
