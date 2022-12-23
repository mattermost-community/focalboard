// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, PayloadAction, createSelector} from '@reduxjs/toolkit'

import {Page, createPage} from '../blocks/page'
import {Utils} from '../utils'

import {initialReadOnlyLoad, loadBoardData} from './initialLoad'
import {getCurrentBoard} from './boards'

import {RootState} from './index'

type PagesState = {
    current: string
    pages: {[key: string]: Page}
}

const pagesSlice = createSlice({
    name: 'pages',
    initialState: {pages: {}, current: ''} as PagesState,
    reducers: {
        setCurrent: (state, action: PayloadAction<string>) => {
            state.current = action.payload
        },
        updatePages: (state, action: PayloadAction<Page[]>) => {
            for (const page of action.payload) {
                if (page.deleteAt === 0) {
                    state.pages[page.id] = page
                } else {
                    delete state.pages[page.id]
                }
            }
        },
        updatePage: (state, action: PayloadAction<Page>) => {
            state.pages[action.payload.id] = action.payload
        },
    },
    extraReducers: (builder) => {
        builder.addCase(initialReadOnlyLoad.fulfilled, (state, action) => {
            state.pages = {}
            for (const block of action.payload.blocks) {
                if (block.type === 'page') {
                    state.pages[block.id] = block as Page
                }
            }
        })
        builder.addCase(loadBoardData.fulfilled, (state, action) => {
            state.pages = {}
            for (const block of action.payload.blocks) {
                if (block.type === 'page') {
                    state.pages[block.id] = block as Page
                }
            }
        })
    },
})

export const {updatePages, setCurrent, updatePage} = pagesSlice.actions
export const {reducer} = pagesSlice

export const getPages = (state: RootState): {[key: string]: Page} => state.pages.pages
export const getSortedPages = createSelector(
    getPages,
    (pages) => {
        return Object.values(pages).sort((a, b) => a.title.localeCompare(b.title)).map((v) => createPage(v))
    },
)

export const getPagesByBoard = createSelector(
    getPages,
    (pages) => {
        const result: {[key: string]: Page[]} = {}
        Object.values(pages).forEach((page) => {
            if (result[page.parentId]) {
                result[page.parentId].push(page)
            } else {
                result[page.parentId] = [page]
            }
        })
        return result
    },
)

export function getPage(pageId: string): (state: RootState) => Page|null {
    return (state: RootState): Page|null => {
        return state.pages.pages[pageId] || null
    }
}

export const getCurrentBoardPages = createSelector(
    (state: RootState) => state.boards.current,
    getPages,
    (boardId, pages) => {
        Utils.log(`getCurrentBoardPages boardId: ${boardId} pages: ${pages.length}`)
        return Object.values(pages).filter((v) => v.boardId === boardId).sort((a, b) => a.title.localeCompare(b.title)).map((v) => createPage(v))
    },
)

export const getCurrentPageId = (state: RootState): string => state.pages.current

export const getCurrentPage = createSelector(
    getPages,
    getCurrentPageId,
    getCurrentBoardPages,
    (pages, pageId, boardPages) => pages[pageId] || boardPages.find((p) => p.parentId === ''),
)

export const getCurrentFolderPage = createSelector(
    getCurrentBoardPages,
    (boardPages) => boardPages.find((p) => p.parentId === ''),
)

export const getCurrentPageGroupBy = createSelector(
    getCurrentBoard,
    getCurrentPage,
    (currentBoard, currentPage) => {
        if (!currentBoard) {
            return undefined
        }
        if (!currentPage) {
            return undefined
        }
        return currentBoard.cardProperties.find((o) => o.id === currentPage.fields.groupById)
    },
)

export const getCurrentPageDisplayBy = createSelector(
    getCurrentBoard,
    getCurrentPage,
    (currentBoard, currentPage) => {
        if (!currentBoard) {
            return undefined
        }
        if (!currentPage) {
            return undefined
        }
        return currentBoard.cardProperties.find((o) => o.id === currentPage.fields.dateDisplayPropertyId)
    },
)
