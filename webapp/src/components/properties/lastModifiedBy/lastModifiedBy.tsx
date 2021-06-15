// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useContext} from 'react'

import {CardTree, CardTreeContext} from '../../../viewModel/cardTree'
import {WorkspaceUsersContext, WorkspaceUsersContextData} from '../../../user'

const LastModifiedBy = (): JSX.Element => {
    const cardTree = useContext<CardTree | undefined>(CardTreeContext)
    const workspaceUsers = useContext<WorkspaceUsersContextData>(WorkspaceUsersContext)

    return (
        <div
            className='LastModifiedBy octo-propertyvalue'
        >{cardTree ? workspaceUsers?.usersById.get(cardTree.latestBlock.modifiedBy)?.username || cardTree.latestBlock.modifiedBy : ''}</div>
    )
}

export default LastModifiedBy
