// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createAsyncThunk, createSelector} from '@reduxjs/toolkit'

import {default as client} from '../octoClient'
import {UserWorkspace} from '../user'
import {Utils} from '../utils'

import {UserBlockSubscription} from '../subscription'

import {RootState} from './index'

const fetchUserWorkspaces = async ():Promise<UserWorkspace[]> => {
    // Concept of workspaces is only applicable when running as a plugin.
    // There is always only one, single workspace in personal server edition.
    return Utils.isFocalboardPlugin() ? client.getUserWorkspaces() : []
}

const fetchUserCardSubscriptions = async (): Promise<Array<UserBlockSubscription>> => {
    // Concept of subscriptions is only applicable when running as a plugin.
    // There are no other users to make changes in standalone version.
    return Utils.isFocalboardPlugin() ? client.getUserBlockSubscriptions() : []
}

export const initialLoad = createAsyncThunk(
    'initialLoad',
    async () => {
        const [workspace, workspaceUsers, blocks, userWorkspaces, userCardSubscriptions] = await Promise.all([
            client.getWorkspace(),
            client.getWorkspaceUsers(),
            client.getAllBlocks(),
            fetchUserWorkspaces(),
            fetchUserCardSubscriptions(),
        ])

        // if no workspace, either bad id, or user doesn't have access
        if (workspace === undefined) {
            throw new Error('Workspace undefined')
        }
        return {
            workspace,
            workspaceUsers,
            blocks,
            userWorkspaces,
            userCardSubscriptions,
        }
    },
)

export const initialReadOnlyLoad = createAsyncThunk(
    'initialReadOnlyLoad',
    async (boardId: string) => {
        const blocks = client.getSubtree(boardId, 3)
        return blocks
    },
)

export const getUserBlockSubscriptions = (state: RootState): Array<UserBlockSubscription> => state.users.blockSubscriptions

export const getUserBlockSubscriptionList = createSelector(
    getUserBlockSubscriptions,
    (subscriptions) => subscriptions,
)
