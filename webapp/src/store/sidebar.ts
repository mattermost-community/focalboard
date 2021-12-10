// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createAsyncThunk, createSelector, createSlice} from '@reduxjs/toolkit'

import {default as client} from '../octoClient'

import {RootState} from './index'

interface Category {
    id: string
    name: string
    userID: string
    teamID: string
    createAt: number
    updateAt: number
    deleteAt: number
}

interface CategoryBlocks extends Category {
    blockIDs: Array<string>
}

export const DefaultCategory: CategoryBlocks = {
    id: '',
    name: 'Boards',
} as CategoryBlocks

export const fetchSidebarCategories = createAsyncThunk(
    'sidebarCategories/fetch',
    async (teamID: string) => client.getSidebarCategories(teamID),
)

type Sidebar = {
    categoryAttributes: Array<CategoryBlocks>
}

const sidebarSlice = createSlice({
    name: 'sidebar',
    initialState: {categoryAttributes: []} as Sidebar,
    reducers: {

    },
    extraReducers: (builder) => {
        builder.addCase(fetchSidebarCategories.fulfilled, (state, action) => {
            state.categoryAttributes = action.payload || []
        })
    },
})

export const getSidebarCategories = createSelector(
    (state: RootState): Array<CategoryBlocks> => state.sidebar.categoryAttributes,
    (sidebarCategories) => sidebarCategories,
)

export const {reducer} = sidebarSlice

export {Category, CategoryBlocks}

