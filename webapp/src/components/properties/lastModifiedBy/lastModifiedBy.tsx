// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useContext} from 'react'

import {CardTree, CardTreeContext} from '../../../viewModel/cardTree'
import {IBlock} from '../../../blocks/block'
import {WorkspaceUsersContext, WorkspaceUsersContextData} from '../../../user'
import {Card} from '../../../blocks/card'

type Props = {
    card: Card
}

const LastModifiedBy = (props: Props): JSX.Element => {
    const cardTree = useContext<CardTree | undefined>(CardTreeContext)
    const workspaceUsers = useContext<WorkspaceUsersContextData>(WorkspaceUsersContext)

    let latestBlock: IBlock = props.card
    cardTree?.allBlocks.forEach((block) => {
        if (latestBlock) {
            latestBlock = block.updateAt > latestBlock.updateAt ? block : latestBlock
        } else {
            latestBlock = block
        }
    })

    return (
        <div className='LastModifiedBy octo-propertyvalue'>{workspaceUsers?.usersById.get(latestBlock.modifiedBy)?.username || latestBlock.modifiedBy}</div>
    )
}

export default LastModifiedBy
