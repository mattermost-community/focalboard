// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createAsyncThunk, createSelector} from '@reduxjs/toolkit'

import {default as client} from '../octoClient'
import {Subscription} from '../wsclient'
import {ErrorId} from '../errors'

import {RootState} from './index'

export const initialLoad = createAsyncThunk(
    'initialLoad',
    async () => {
        const [team, teams, boards, boardsMemberships, boardTemplates] = await Promise.all([
            client.getTeam(),
            client.getTeams(),
            client.getBoards(),
            client.getMyBoardMemberships(),
            client.getTeamTemplates(),
        ])

        // if no team, either bad id, or user doesn't have access
        if (!team) {
            throw new Error(ErrorId.TeamUndefined)
        }
        return {
            team,
            teams,
            boards,
            boardsMemberships,
            boardTemplates,
        }
    },
)

export const initialReadOnlyLoad = createAsyncThunk(
    'initialReadOnlyLoad',
    async (boardId: string) => {
        const [board, blocks] = await Promise.all([
            client.getBoard(boardId),
            client.getAllBlocks(boardId),
        ])

        return {board, blocks}
    },
)

export const loadBoardData = createAsyncThunk(
    'loadBoardData',
    async (boardID: string) => {
        const blocks = await client.getAllBlocks(boardID)
        return {
            blocks,
        }
    },
)

export const getUserBlockSubscriptions = (state: RootState): Array<Subscription> => state.users.blockSubscriptions

export const getUserBlockSubscriptionList = createSelector(
    getUserBlockSubscriptions,
    (subscriptions) => subscriptions,
)
