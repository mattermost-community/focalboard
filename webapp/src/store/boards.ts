// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit'

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
        updateBoards: (state, action: PayloadAction<MutableBoard[]>) => {
            const updatedBoardIds = action.payload.filter((o: Board) => !o.fields.isTemplate).map((o: Board) => o.id)
            const newBoards = state.boards.filter((o: Board) => !updatedBoardIds.includes(o.id))
            const updatedAndNotDeletedBoards = action.payload.filter((o: Board) => o.deleteAt === 0 && !o.fields.isTemplate)
            newBoards.push(...updatedAndNotDeletedBoards)
            state.boards = newBoards.sort((a, b) => a.title.localeCompare(b.title)) as MutableBoard[]

            const updatedTemplateIds = action.payload.filter((o: Board) => o.fields.isTemplate).map((o: Board) => o.id)
            const newTemplates = state.boards.filter((o: Board) => !updatedTemplateIds.includes(o.id))
            const updatedAndNotDeletedTemplates = action.payload.filter((o: Board) => o.deleteAt === 0 && o.fields.isTemplate)
            newTemplates.push(...updatedAndNotDeletedTemplates)
            state.templates = newTemplates.sort((a, b) => a.title.localeCompare(b.title)) as MutableBoard[]
        },
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

export const {updateBoards} = boardsSlice.actions
export const {reducer} = boardsSlice

export function getBoards(state: RootState): Board[] {
    return state.boards.boards
}

export function getTemplates(state: RootState): Board[] {
    return state.boards.templates
}
