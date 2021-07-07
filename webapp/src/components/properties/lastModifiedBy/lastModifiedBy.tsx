// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useContext} from 'react'

import {WorkspaceUsersContext, WorkspaceUsers} from '../../../user'
import {Card} from '../../../blocks/card'
import {BoardTree} from '../../../viewModel/boardTree'
import {IBlock} from '../../../blocks/block'

type Props = {
    card: Card,
    boardTree?: BoardTree,
}

const LastModifiedBy = (props: Props): JSX.Element => {
    let latestBlock: IBlock = props.card
    if (props.boardTree) {
        const sortedBlocks = props.boardTree?.allBlocks.
            filter((block) => block.parentId === props.card.id || block.id === props.card.id).
            sort((a, b) => b.updateAt - a.updateAt)

        latestBlock = sortedBlocks.length > 0 ? sortedBlocks[0] : latestBlock
    }

    const workspaceUsers = useContext<WorkspaceUsers>(WorkspaceUsersContext)

    return (
        <div className='LastModifiedBy octo-propertyvalue'>
            {workspaceUsers?.usersById.get(latestBlock.modifiedBy)?.username || latestBlock.modifiedBy}
        </div>
    )
}

export default LastModifiedBy
