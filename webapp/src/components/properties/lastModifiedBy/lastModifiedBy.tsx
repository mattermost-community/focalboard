// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {IUser} from '../../../user'
import {Card} from '../../../blocks/card'
import {Board} from '../../../blocks/board'
import {Block} from '../../../blocks/block'
import {getBoardUsers} from '../../../store/users'
import {useAppSelector} from '../../../store/hooks'
import {getLastCardContent} from '../../../store/contents'
import {getLastCardComment} from '../../../store/comments'
import './lastModifiedBy.scss'

type Props = {
    card: Card,
    board?: Board,
}

const LastModifiedBy = (props: Props): JSX.Element => {
    const boardUsersById = useAppSelector<{[key:string]: IUser}>(getBoardUsers)
    const lastContent = useAppSelector(getLastCardContent(props.card.id || '')) as Block
    const lastComment = useAppSelector(getLastCardComment(props.card.id)) as Block

    let latestBlock: Block = props.card
    if (props.board) {
        const allBlocks: Block[] = [props.card, lastContent, lastComment]
        const sortedBlocks = allBlocks.sort((a, b) => b.updateAt - a.updateAt)

        latestBlock = sortedBlocks.length > 0 ? sortedBlocks[0] : latestBlock
    }

    return (
        <div className='LastModifiedBy octo-propertyvalue readonly'>
            {(boardUsersById && boardUsersById[latestBlock.modifiedBy]?.username) || latestBlock.modifiedBy}
        </div>
    )
}

export default LastModifiedBy
