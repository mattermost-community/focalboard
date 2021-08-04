// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createAsyncThunk} from '@reduxjs/toolkit'

import {default as client} from '../octoClient'

export const initialLoad = createAsyncThunk(
    'initialLoad',
    async () => {
        const [workspace, workspaceUsers, blocks] = await Promise.all([
            client.getWorkspace(),
            client.getWorkspaceUsers(),
            client.getAllBlocks(),
        ])
        if (!workspace) {
            throw new Error('no_workspace')
        }
        return {
            workspace,
            workspaceUsers,
            blocks,
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
