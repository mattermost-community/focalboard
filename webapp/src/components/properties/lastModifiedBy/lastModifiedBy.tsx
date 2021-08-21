// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {IUser} from '../../../user'
import {Card} from '../../../blocks/card'
import {ContentBlock} from '../../../blocks/contentBlock'
import {CommentBlock} from '../../../blocks/commentBlock'
import {Board} from '../../../blocks/board'
import {Block} from '../../../blocks/block'
import {getWorkspaceUsers} from '../../../store/users'
import {useAppSelector} from '../../../store/hooks'

type Props = {
    card: Card,
    board?: Board,
    contents: Array<ContentBlock|ContentBlock[]>
    comments: CommentBlock[],
}

const LastModifiedBy = (props: Props): JSX.Element => {
    const workspaceUsersById = useAppSelector<{[key:string]: IUser}>(getWorkspaceUsers)

    let latestBlock: Block = props.card
    if (props.board) {
        const allBlocks: Block[] = [props.card, ...props.contents.flat(), ...props.comments]
        const sortedBlocks = allBlocks.sort((a, b) => b.updateAt - a.updateAt)

        latestBlock = sortedBlocks.length > 0 ? sortedBlocks[0] : latestBlock
    }

    return (
        <div className='LastModifiedBy octo-propertyvalue readonly'>
            {(workspaceUsersById && workspaceUsersById[latestBlock.modifiedBy]?.username) || latestBlock.modifiedBy}
        </div>
    )
}

export default LastModifiedBy
