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
        const [team, boards] = await Promise.all([

            // ToDo: get board members maybe?
            // ToDo: get user boards
            // ToDo: replace getallblocks with get board blocks? or directly when loading the board?
            // client.getAllBlocks(),

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
        console.log('boardDataLoad called')
        const [blocks] = await Promise.all([
            client.getAllBlocks(boardID),
        ])

        return {
            blocks,
        }
    },
)
