// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createAsyncThunk, createSelector, createSlice, PayloadAction} from '@reduxjs/toolkit'

import {default as client} from '../octoClient'

import {Utils} from '../utils'

import {RootState} from './index'

export type CategoryType = 'system' | 'custom'

interface Category {
    id: string
    name: string
    userID: string
    teamID: string
    createAt: number
    updateAt: number
    deleteAt: number
    collapsed: boolean
    sortOrder: number
    type: CategoryType
    isNew: boolean
}

interface CategoryBoards extends Category {
    boardIDs: string[]
}

interface BoardCategoryWebsocketData {
    boardID: string
    categoryID: string
}

interface CategoryBoardsReorderData {
    categoryID: string
    boardIDs: string[]
}

export const DefaultCategory: CategoryBoards = {
    id: '',
    name: 'Boards',
} as CategoryBoards

export const fetchSidebarCategories = createAsyncThunk(
    'sidebarCategories/fetch',
    async (teamID: string) => {
        return client.getSidebarCategories(teamID)
    },
)

type Sidebar = {
    categoryAttributes: CategoryBoards[]
}

const sidebarSlice = createSlice({
    name: 'sidebar',
    initialState: {categoryAttributes: []} as Sidebar,
    reducers: {
        updateCategories: (state, action: PayloadAction<Category[]>) => {
            action.payload.forEach((updatedCategory) => {
                const index = state.categoryAttributes.findIndex((c) => c.id === updatedCategory.id)

                // when new category got created,
                if (index === -1) {
                    // new categories should always show up on the top
                    state.categoryAttributes.unshift({
                        ...updatedCategory,
                        boardIDs: [],
                        isNew: true,
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
                        isNew: false,
                    }
                }
            })
        },
        updateBoardCategories: (state, action: PayloadAction<BoardCategoryWebsocketData[]>) => {
            const updatedCategoryAttributes: CategoryBoards[] = []

            action.payload.forEach((boardCategory) => {
                for (let i = 0; i < state.categoryAttributes.length; i++) {
                    const categoryAttribute = state.categoryAttributes[i]

                    if (categoryAttribute.id === boardCategory.categoryID) {
                        // if board is already in the right category, don't do anything
                        // and let the board stay in its right order.
                        // Only if its not in the right category, do add it.
                        if (categoryAttribute.boardIDs.indexOf(boardCategory.boardID) < 0) {
                            categoryAttribute.boardIDs.unshift(boardCategory.boardID)
                            categoryAttribute.isNew = false
                        }
                    } else {
                        // remove the board from other categories
                        categoryAttribute.boardIDs = categoryAttribute.boardIDs.filter((boardID) => boardID !== boardCategory.boardID)
                    }

                    updatedCategoryAttributes[i] = categoryAttribute
                }
            })

            if (updatedCategoryAttributes.length > 0) {
                state.categoryAttributes = updatedCategoryAttributes
            }
        },
        updateCategoryOrder: (state, action: PayloadAction<string[]>) => {
            if (action.payload.length === 0) {
                return
            }

            const categoryById = new Map<string, CategoryBoards>()
            state.categoryAttributes.forEach((categoryBoards: CategoryBoards) => categoryById.set(categoryBoards.id, categoryBoards))

            const newOrderedCategories: CategoryBoards[] = []
            action.payload.forEach((categoryId) => {
                const category = categoryById.get(categoryId)
                if (!category) {
                    Utils.logError('Category ID from updated category order not found in store. CategoryID: ' + categoryId)
                    return
                }
                newOrderedCategories.push(category)
            })

            state.categoryAttributes = newOrderedCategories
        },
        updateCategoryBoardsOrder: (state, action: PayloadAction<CategoryBoardsReorderData>) => {
            if (action.payload.boardIDs.length === 0) {
                return
            }

            const categoryIndex = state.categoryAttributes.findIndex((categoryBoards) => categoryBoards.id === action.payload.categoryID)
            if (categoryIndex < 0) {
                Utils.logError('Category ID from updated category boards order not found in store. CategoryID: ' + action.payload.categoryID)
                return
            }

            const category = state.categoryAttributes[categoryIndex]
            const updatedCategory = {
                ...category,
                boardIDs: action.payload.boardIDs,
                isNew: false,
            }

            // creating a new reference of array so redux knows it changed
            state.categoryAttributes = state.categoryAttributes.map((original, i) => (i === categoryIndex ? updatedCategory : original))
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchSidebarCategories.fulfilled, (state, action) => {
            state.categoryAttributes = action.payload || []
        })
    },
})

export const getSidebarCategories = createSelector(
    (state: RootState): CategoryBoards[] => state.sidebar.categoryAttributes,
    (sidebarCategories) => sidebarCategories,
)

export const {reducer} = sidebarSlice

export const {updateCategories, updateBoardCategories, updateCategoryOrder, updateCategoryBoardsOrder} = sidebarSlice.actions

export {Category, CategoryBoards, BoardCategoryWebsocketData, CategoryBoardsReorderData}

