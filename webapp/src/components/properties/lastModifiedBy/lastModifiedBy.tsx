// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useContext} from 'react'

import {WorkspaceUsersContext, WorkspaceUsers} from '../../../user'
import {Card} from '../../../blocks/card'
import {BoardTree} from '../../../viewModel/boardTree'

type Props = {
    card: Card,
    boardTree?: BoardTree,
}

// TODO use useMemo here
const LastModifiedBy = (props: Props): JSX.Element => {
    let latestBlock = props.boardTree?.allBlocks.filter((block) => block.parentId === props.card.id || block.id === props.card.id).sort((a, b) => b.updateAt - a.updateAt)[0]
    latestBlock = latestBlock || props.card

    const workspaceUsers = useContext<WorkspaceUsers>(WorkspaceUsersContext)

    return (
        <div
            className='LastModifiedBy octo-propertyvalue'
        >{workspaceUsers?.usersById.get(latestBlock.modifiedBy)?.username || latestBlock.modifiedBy}</div>
    )
}

export default LastModifiedBy
