// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, createAsyncThunk} from '@reduxjs/toolkit'

import {default as client} from '../octoClient'
import {MutableBoard, Board} from '../blocks/board'

import {RootState} from './index'

export const fetchBoards = createAsyncThunk(
    'boards/fetch',
    async () => client.getBlocksWithType('board'),
)

const boardsSlice = createSlice({
    name: 'boards',
    initialState: {boards: [], templates: []} as {boards: MutableBoard[], templates: MutableBoard[]},
    reducers: {
    },
    extraReducers: (builder) => {
        builder.addCase(fetchBoards.fulfilled, (state, action) => {
            state.boards = action.payload.filter((block) => !block.fields.isTemplate).
                sort((a, b) => a.title.localeCompare(b.title)) as MutableBoard[]
            state.templates = action.payload.filter((block) => block.fields.isTemplate).
                sort((a, b) => a.title.localeCompare(b.title)) as MutableBoard[]
        })
    },
})

//export const {} = boardsSlice.actions
export const {reducer} = boardsSlice

export function getBoards(state: RootState): Board[] {
    return state.boards.boards
}

export function getTemplates(state: RootState): Board[] {
    return state.boards.templates
}
