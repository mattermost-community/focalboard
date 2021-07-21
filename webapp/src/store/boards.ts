// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, PayloadAction} from '@reduxjs/toolkit'

import {Board} from '../blocks/board'

import {initialLoad} from './initialLoad'

import {RootState} from './index'

const boardsSlice = createSlice({
    name: 'boards',
    initialState: {boards: [], templates: []} as {boards: Board[], templates: Board[]},
    reducers: {
        updateBoards: (state, action: PayloadAction<Board[]>) => {
            const updatedBoardIds = action.payload.filter((o: Board) => !o.fields?.isTemplate).map((o: Board) => o.id)
            const newBoards = state.boards.filter((o: Board) => !updatedBoardIds.includes(o.id)).map((o) => new Board(o))
            const updatedAndNotDeletedBoards = action.payload.filter((o: Board) => o.deleteAt === 0 && !o.fields?.isTemplate)
            newBoards.push(...updatedAndNotDeletedBoards)
            state.boards = newBoards.sort((a, b) => a.title.localeCompare(b.title)).map((o) => new Board(o))

            const updatedTemplateIds = action.payload.filter((o: Board) => o.fields?.isTemplate).map((o: Board) => o.id)
            const newTemplates = state.boards.filter((o: Board) => !updatedTemplateIds.includes(o.id)).map((o) => new Board(o))
            const updatedAndNotDeletedTemplates = action.payload.filter((o: Board) => o.deleteAt === 0 && o.fields?.isTemplate)
            newTemplates.push(...updatedAndNotDeletedTemplates)
            state.templates = newTemplates.sort((a, b) => a.title.localeCompare(b.title))
        },
    },
    extraReducers: (builder) => {
        builder.addCase(initialLoad.fulfilled, (state, action) => {
            state.boards = action.payload.blocks.filter((block) => block.type === 'board' && !block.fields.isTemplate).
                sort((a, b) => a.title.localeCompare(b.title)).map((o) => new Board(o))
            state.templates = action.payload.blocks.filter((block) => block.type === 'board' && block.fields.isTemplate).
                sort((a, b) => a.title.localeCompare(b.title)).map((o) => new Board(o))
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

export function getBoard(boardId: string): (state: RootState) => Board|null {
    return (state: RootState): Board|null => {
        return state.boards.boards.find((b) => b.id === boardId) || state.boards.templates.find((b) => b.id === boardId) || null
    }
}
