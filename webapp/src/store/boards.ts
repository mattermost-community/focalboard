// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, PayloadAction, createSelector} from '@reduxjs/toolkit'

import {Board} from '../blocks/board'

import {initialLoad, initialReadOnlyLoad} from './initialLoad'

import {RootState} from './index'

type BoardsState = {
    current: string
    boards: {[key: string]: Board}
    templates: {[key: string]: Board}
}

const boardsSlice = createSlice({
    name: 'boards',
    initialState: {boards: {}, templates: {}} as BoardsState,
    reducers: {
        setCurrent: (state, action: PayloadAction<string>) => {
            state.current = action.payload
        },
        updateBoards: (state, action: PayloadAction<Board[]>) => {
            for (const board of action.payload) {
                if (board.deleteAt !== 0) {
                    delete state.boards[board.id]
                    delete state.templates[board.id]
                } else if (board.fields.isTemplate) {
                    state.templates[board.id] = board
                } else {
                    state.boards[board.id] = board
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(initialReadOnlyLoad.fulfilled, (state, action) => {
            state.boards = {}
            state.templates = {}
            for (const block of action.payload) {
                if (block.type === 'board' && block.fields.isTemplate) {
                    state.templates[block.id] = block as Board
                } else if (block.type === 'board' && !block.fields.isTemplate) {
                    state.boards[block.id] = block as Board
                }
            }
        })
        builder.addCase(initialLoad.fulfilled, (state, action) => {
            state.boards = {}
            state.templates = {}
            for (const block of action.payload.blocks) {
                if (block.type === 'board' && block.fields.isTemplate) {
                    state.templates[block.id] = block as Board
                } else if (block.type === 'board' && !block.fields.isTemplate) {
                    state.boards[block.id] = block as Board
                }
            }
        })
    },
})

export const {updateBoards, setCurrent} = boardsSlice.actions
export const {reducer} = boardsSlice

export const getBoards = (state: RootState): {[key: string]: Board} => state.boards.boards

export const getSortedBoards = createSelector(
    getBoards,
    (boards) => {
        return Object.values(boards).sort((a, b) => a.title.localeCompare(b.title))
    },
)

export const getTemplates = (state: RootState): {[key: string]: Board} => state.boards.templates

export const getSortedTemplates = createSelector(
    getTemplates,
    (templates) => {
        return Object.values(templates).sort((a, b) => a.title.localeCompare(b.title))
    },
)

export function getBoard(boardId: string): (state: RootState) => Board|null {
    return (state: RootState): Board|null => {
        return state.boards.boards[boardId] || state.boards.templates[boardId] || null
    }
}

export const getCurrentBoard = createSelector(
    (state) => state.boards.current,
    getBoards,
    getTemplates,
    (boardId, boards, templates) => {
        return boards[boardId] || templates[boardId]
    },
)
