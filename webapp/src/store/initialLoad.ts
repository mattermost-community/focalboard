// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createAsyncThunk} from '@reduxjs/toolkit'

import {default as client} from '../octoClient'
import {UserWorkspace} from '../user'
import {Utils} from '../utils'

const getUserWorkspaces = async ():Promise<UserWorkspace[]> => {
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
            getUserWorkspaces(),
        ])
        if (!workspace) {
            throw new Error('no_workspace')
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
