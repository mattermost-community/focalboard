// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createAsyncThunk, createSelector, createSlice, PayloadAction} from '@reduxjs/toolkit'

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

interface BlockCategoryWebsocketData {
    blockID: string
    categoryID: string
}

export const DefaultCategory: CategoryBlocks = {
    id: '',
    name: 'Boards',
} as CategoryBlocks

export const fetchSidebarCategories = createAsyncThunk(
    'sidebarCategories/fetch',
    async (teamID: string) => {
        const categories = await client.getSidebarCategories(teamID)
        return categories.sort((a, b) => a.name.localeCompare(b.name))
    },
)

type Sidebar = {
    categoryAttributes: Array<CategoryBlocks>
}

const sidebarSlice = createSlice({
    name: 'sidebar',
    initialState: {categoryAttributes: []} as Sidebar,
    reducers: {
        updateCategories: (state, action: PayloadAction<Array<Category>>) => {
            action.payload.forEach((updatedCategory) => {
                const index = state.categoryAttributes.findIndex((c) => c.id === updatedCategory.id)

                // when new category got created
                if (index === -1) {
                    state.categoryAttributes.push({
                        ...updatedCategory,
                        blockIDs: [],
                    })
                } else if (updatedCategory.deleteAt) {
                    // when category is deleted
                    state.categoryAttributes.splice(index, 1)
                } else {
                    // else all, update the category
                    state.categoryAttributes[index] = {
                        ...state.categoryAttributes[index],
                        name: updatedCategory.name,
                        updateAt: updatedCategory.updateAt,
                    }
                }
            })
        },
        updateBlockCategories: (state, action: PayloadAction<Array<BlockCategoryWebsocketData>>) => {
            action.payload.forEach((blockCategory) => {
                for (let i = 0; i < state.categoryAttributes.length; i++) {
                    const categoryAttribute = state.categoryAttributes[i]

                    // first we remove the block from list of blocks
                    categoryAttribute.blockIDs = categoryAttribute.blockIDs.filter((blockID) => blockID !== blockCategory.blockID)

                    // then we add it if this is the target category
                    if (categoryAttribute.id === blockCategory.categoryID) {
                        categoryAttribute.blockIDs.push(blockCategory.blockID)
                    }
                }
            })
        },
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

export const {updateCategories, updateBlockCategories} = sidebarSlice.actions

export {Category, CategoryBlocks, BlockCategoryWebsocketData}

