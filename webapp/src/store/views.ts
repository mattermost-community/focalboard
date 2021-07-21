// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, PayloadAction, createSelector} from '@reduxjs/toolkit'

import {BoardView} from '../blocks/boardView'

import {initialLoad} from './initialLoad'

import {RootState} from './index'

type ViewsState = {
    current: string
    views: {[key: string]: BoardView}
}

const viewsSlice = createSlice({
    name: 'views',
    initialState: {views: {}, current: ''} as ViewsState,
    reducers: {
        setCurrent: (state, action: PayloadAction<string>) => {
            state.current = action.payload
        },
        updateViews: (state, action: PayloadAction<BoardView[]>) => {
            for (const view of action.payload) {
                if (view.deleteAt === 0) {
                    state.views[view.id] = view
                } else {
                    delete state.views[view.id]
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(initialLoad.fulfilled, (state, action) => {
            for (const block of action.payload.blocks) {
                if (block.type === 'view') {
                    state.views[block.id] = block as BoardView
                }
            }
        })
    },
})

export const {updateViews, setCurrent} = viewsSlice.actions
export const {reducer} = viewsSlice

export const getViews = (state: RootState): {[key: string]: BoardView} => state.views.views
export const getSortedViews = createSelector(
    getViews,
    (views) => {
        return Object.values(views).sort((a, b) => a.title.localeCompare(b.title)).map((v) => new BoardView(v))
    },
)

export function getView(viewId: string): (state: RootState) => BoardView|null {
    return (state: RootState): BoardView|null => {
        return state.views.views[viewId] || null
    }
}

export const getCurrentBoardViews = createSelector(
    (state) => state.boards.current,
    getViews,
    (boardId, views) => {
        return Object.values(views).filter((v) => v.parentId === boardId).sort((a, b) => a.title.localeCompare(b.title)).map((v) => new BoardView(v))
    },
)
