// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit'

import {default as client} from '../octoClient'
import {MutableBoardView, BoardView} from '../blocks/boardView'

import {RootState} from './index'

export const fetchViews = createAsyncThunk(
    'views/fetch',
    async () => client.getBlocksWithType('view'),
)

const viewsSlice = createSlice({
    name: 'views',
    initialState: {views: []} as {views: MutableBoardView[]},
    reducers: {
        updateViews: (state, action: PayloadAction<MutableBoardView[]>) => {
            const updatedViewIds = action.payload.map((o: BoardView) => o.id)
            const newViews = state.views.filter((o: BoardView) => !updatedViewIds.includes(o.id))
            const updatedAndNotDeletedViews = action.payload.filter((o: BoardView) => o.deleteAt === 0)
            newViews.push(...updatedAndNotDeletedViews)
            state.views = newViews.sort((a, b) => a.title.localeCompare(b.title)) as MutableBoardView[]
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchViews.fulfilled, (state, action) => {
            state.views = action.payload.sort((a, b) => a.title.localeCompare(b.title)) as MutableBoardView[]
        })
    },
})

export const {updateViews} = viewsSlice.actions
export const {reducer} = viewsSlice

export function getViews(state: RootState): BoardView[] {
    return state.views.views
}
