// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createAsyncThunk, createSelector} from '@reduxjs/toolkit'

import {default as client} from '../octoClient'
import {UserWorkspace} from '../user'
import {Utils} from '../utils'

import {Subscription} from '../wsclient'

import {RootState} from './index'

const fetchUserWorkspaces = async ():Promise<UserWorkspace[]> => {
    // Concept of workspaces is only applicable when running as a plugin.
    // There is always only one, single workspace in personal server edition.
    return Utils.isFocalboardPlugin() ? client.getUserWorkspaces() : []
}

export const initialLoad = createAsyncThunk(
    'initialLoad',
    async () => {
        const [workspace, workspaceUsers, blocks, userWorkspaces] = await Promise.all([
            client.getWorkspace(),
            client.getWorkspaceUsers(),
            client.getAllBlocks(),
            fetchUserWorkspaces(),
        ])

        // if no workspace, either bad id, or user doesn't have access
        if (workspace === undefined) {
            throw new Error('workspace-undefined')
        }
        return {
            workspace,
            workspaceUsers,
            blocks,
            userWorkspaces,
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

export const getUserBlockSubscriptions = (state: RootState): Array<Subscription> => state.users.blockSubscriptions

export const getUserBlockSubscriptionList = createSelector(
    getUserBlockSubscriptions,
    (subscriptions) => subscriptions,
)
