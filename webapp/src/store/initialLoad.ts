// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createAsyncThunk, createSelector} from '@reduxjs/toolkit'

import {default as client} from '../octoClient'
import {Subscription} from '../wsclient'

import {RootState} from './index'

export const initialLoad = createAsyncThunk(
    'initialLoad',
    async () => {
        const [team, boards] = await Promise.all([

            // ToDo: get board members maybe?
            // ToDo: get user boards
            // ToDo: probably add memberships here

            client.getTeam(),
            client.getBoards(),
        ])

        // ToDo: do we really need to get the team info?? wouldn't it be the board info?
        // if no workspace, either bad id, or user doesn't have access
        // if (team === undefined) {
        //     throw new Error('Workspace undefined')
        // }
        return {
            team,
            boards,

            // ToDo: return extra Promise.all things
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

export const loadBoardData = createAsyncThunk(
    'loadBoardData',
    async (boardID: string) => {
        const [blocks] = await Promise.all([
            client.getAllBlocks(boardID),
        ])

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
