// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {IUser} from '../../../user'
import {Card} from '../../../blocks/card'
import {BoardTree} from '../../../viewModel/boardTree'
import {IBlock} from '../../../blocks/block'
import {getCurrentWorkspaceUsersById} from '../../../store/currentWorkspaceUsers'
import {useAppSelector} from '../../../store/hooks'

type Props = {
    card: Card,
    boardTree?: BoardTree,
}

const LastModifiedBy = (props: Props): JSX.Element => {
    const workspaceUsersById = useAppSelector<{[key:string]: IUser}>(getCurrentWorkspaceUsersById)

    let latestBlock: IBlock = props.card
    if (props.boardTree) {
        const sortedBlocks = props.boardTree?.allBlocks.
            filter((block) => block.parentId === props.card.id || block.id === props.card.id).
            sort((a, b) => b.updateAt - a.updateAt)

        latestBlock = sortedBlocks.length > 0 ? sortedBlocks[0] : latestBlock
    }

    return (
        <div className='LastModifiedBy octo-propertyvalue'>
            {(workspaceUsersById && workspaceUsersById[latestBlock.modifiedBy]?.username) || latestBlock.modifiedBy}
        </div>
    )
}

export default LastModifiedBy
