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

interface CategoryBoards extends Category {
    boardIDs: Array<string>
}

interface BoardCategoryWebsocketData {
    boardID: string
    categoryID: string
}

export const DefaultCategory: CategoryBoards = {
    id: '',
    name: 'Boards',
} as CategoryBoards

export const fetchSidebarCategories = createAsyncThunk(
    'sidebarCategories/fetch',
    async (teamID: string) => {
        const categories = await client.getSidebarCategories(teamID)
        return categories.sort((a, b) => a.name.localeCompare(b.name))
    },
)

type Sidebar = {
    categoryAttributes: Array<CategoryBoards>
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
                        boardIDs: [],
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
            
            // sort categories alphabetically
            state.categoryAttributes.sort((a, b) => a.name.localeCompare(b.name))
        },
        updateBoardCategories: (state, action: PayloadAction<Array<BoardCategoryWebsocketData>>) => {
            action.payload.forEach((boardCategory) => {
                for (let i = 0; i < state.categoryAttributes.length; i++) {
                    const categoryAttribute = state.categoryAttributes[i]

                    // first we remove the board from list of boards
                    categoryAttribute.boardIDs = categoryAttribute.boardIDs.filter((boardID) => boardID !== boardCategory.boardID)

                    // then we add it if this is the target category
                    if (categoryAttribute.id === boardCategory.categoryID) {
                        categoryAttribute.boardIDs.push(boardCategory.boardID)
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
    (state: RootState): Array<CategoryBoards> => state.sidebar.categoryAttributes,
    (sidebarCategories) => sidebarCategories,
)

export const {reducer} = sidebarSlice

export const {updateCategories, updateBoardCategories} = sidebarSlice.actions

export {Category, CategoryBoards, BoardCategoryWebsocketData}

