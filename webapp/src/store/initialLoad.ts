// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createAsyncThunk} from '@reduxjs/toolkit'

import {default as client} from '../octoClient'

export const initialLoad = createAsyncThunk(
    'initialLoad',
    async () => {
        const [team, teamUsers, blocks] = await Promise.all([
            client.getTeam(),
            client.getTeamUsers(),
            client.getAllBlocks(),
        ])
        if (!team) {
            throw new Error('no_team')
        }
        return {
            team,
            teamUsers,
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
