// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, PayloadAction, createSelector} from '@reduxjs/toolkit'

import {ContentBlock} from '../blocks/contentBlock'

import {getCards, getTemplates} from './cards'
import {getCurrentPage} from './pages'
import {loadBoardData, initialReadOnlyLoad} from './initialLoad'

import {RootState} from './index'

type ContentsState = {
    contents: {[key: string]: ContentBlock}
    contentsByCard: {[key: string]: ContentBlock[]}
    contentsByPage: {[key: string]: ContentBlock[]}
}

const contentsSlice = createSlice({
    name: 'contents',
    initialState: {contents: {}, contentsByCard: {}, contentsByPage: {}} as ContentsState,
    reducers: {
        updateContents: (state, action: PayloadAction<ContentBlock[]>) => {
            for (const content of action.payload) {
                if (content.deleteAt === 0) {
                    let existsInParent = false
                    state.contents[content.id] = content
                    if (content.parentId && (content.parentId.startsWith('p') || content.parentId.startsWith('b'))) {
                        if (!state.contentsByPage[content.parentId]) {
                            state.contentsByPage[content.parentId] = [content]
                            return
                        }
                        for (let i = 0; i < state.contentsByPage[content.parentId].length; i++) {
                            if (state.contentsByPage[content.parentId][i].id === content.id) {
                                state.contentsByPage[content.parentId][i] = content
                                existsInParent = true
                                break
                            }
                        }
                        if (!existsInParent) {
                            state.contentsByPage[content.parentId].push(content)
                        }
                    } else {
                        if (!state.contentsByCard[content.parentId]) {
                            state.contentsByCard[content.parentId] = [content]
                            return
                        }
                        for (let i = 0; i < state.contentsByCard[content.parentId].length; i++) {
                            if (state.contentsByCard[content.parentId][i].id === content.id) {
                                state.contentsByCard[content.parentId][i] = content
                                existsInParent = true
                                break
                            }
                        }
                        if (!existsInParent) {
                            state.contentsByCard[content.parentId].push(content)
                        }
                    }
                } else {
                    const parentId = state.contents[content.id]?.parentId
                    if (parentId && (parentId.startsWith('p') || parentId.startsWith('b'))) {
                        if (!state.contentsByPage[parentId]) {
                            delete state.contents[content.id]
                            return
                        }
                        for (let i = 0; i < state.contentsByPage[parentId].length; i++) {
                            if (state.contentsByPage[parentId][i].id === content.id) {
                                state.contentsByPage[parentId].splice(i, 1)
                            }
                        }
                    } else {
                        if (!state.contentsByCard[parentId]) {
                            delete state.contents[content.id]
                            return
                        }
                        for (let i = 0; i < state.contentsByCard[parentId].length; i++) {
                            if (state.contentsByCard[parentId][i].id === content.id) {
                                state.contentsByCard[parentId].splice(i, 1)
                            }
                        }
                    }
                    delete state.contents[content.id]
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(initialReadOnlyLoad.fulfilled, (state, action) => {
            state.contents = {}
            state.contentsByCard = {}
            for (const block of action.payload.blocks) {
                if (block.type !== 'board' && block.type !== 'view' && block.type !== 'comment' && block.type !== 'page') {
                    state.contents[block.id] = block as ContentBlock
                    if (block.parentId && (block.parentId.startsWith('p') || block.parentId.startsWith('b'))) {
                        state.contentsByPage[block.parentId] = state.contentsByPage[block.parentId] || []
                        state.contentsByPage[block.parentId].push(block as ContentBlock)
                        state.contentsByPage[block.parentId].sort((a, b) => a.createAt - b.createAt)
                    } else {
                        state.contentsByCard[block.parentId] = state.contentsByCard[block.parentId] || []
                        state.contentsByCard[block.parentId].push(block as ContentBlock)
                        state.contentsByCard[block.parentId].sort((a, b) => a.createAt - b.createAt)
                    }
                }
            }
        })
        builder.addCase(loadBoardData.fulfilled, (state, action) => {
            state.contents = {}
            state.contentsByCard = {}
            for (const block of action.payload.blocks) {
                if (block.type !== 'board' && block.type !== 'view' && block.type !== 'comment' && block.type !== 'page') {
                    state.contents[block.id] = block as ContentBlock
                    if (block.parentId && (block.parentId.startsWith('p') || block.parentId.startsWith('b'))) {
                        state.contentsByPage[block.parentId] = state.contentsByPage[block.parentId] || []
                        state.contentsByPage[block.parentId].push(block as ContentBlock)
                        state.contentsByPage[block.parentId].sort((a, b) => a.createAt - b.createAt)
                    } else {
                        state.contentsByCard[block.parentId] = state.contentsByCard[block.parentId] || []
                        state.contentsByCard[block.parentId].push(block as ContentBlock)
                        state.contentsByCard[block.parentId].sort((a, b) => a.createAt - b.createAt)
                    }
                }
            }
        })
    },
})

export const {updateContents} = contentsSlice.actions
export const {reducer} = contentsSlice

export const getContentsById = (state: RootState): {[key: string]: ContentBlock} => state.contents.contents

export const getContents = createSelector(
    getContentsById,
    (contents) => Object.values(contents),
)

export function getCardContents(cardId: string): (state: RootState) => Array<ContentBlock|ContentBlock[]> {
    return createSelector(
        (state: RootState) => (state.contents?.contentsByCard && state.contents.contentsByCard[cardId]) || [],
        (state: RootState) => getCards(state)[cardId]?.fields?.contentOrder || getTemplates(state)[cardId]?.fields?.contentOrder,
        (contents, contentOrder): Array<ContentBlock|ContentBlock[]> => {
            const result: Array<ContentBlock|ContentBlock[]> = []
            if (!contents) {
                return []
            }
            if (contentOrder) {
                for (const contentId of contentOrder) {
                    if (typeof contentId === 'string') {
                        const content = contents.find((c) => c.id === contentId)
                        if (content) {
                            result.push(content)
                        }
                    } else if (typeof contentId === 'object' && contentId) {
                        const subResult: ContentBlock[] = []
                        for (const subContentId of contentId) {
                            if (typeof subContentId === 'string') {
                                const subContent = contents.find((c) => c.id === subContentId)
                                if (subContent) {
                                    subResult.push(subContent)
                                }
                            }
                        }
                        result.push(subResult)
                    }
                }
            }
            return result
        },
    )
}

export const getCurrentPageContents = createSelector(
    (state: RootState) => state.contents?.contentsByPage,
    getCurrentPage,
    (contentsByPage, currentPage): Array<ContentBlock|ContentBlock[]> => {
        const page = currentPage
        if (!page) {
            return []
        }
        const contents = contentsByPage[page.id]
        const contentOrder = currentPage?.fields?.contentOrder
        if (!contents || !contentOrder) {
            return []
        }

        const result: Array<ContentBlock|ContentBlock[]> = []
        for (const contentId of contentOrder) {
            if (typeof contentId === 'string') {
                const content = contents.find((c) => c.id === contentId)
                if (content) {
                    result.push(content)
                }
            } else if (typeof contentId === 'object' && contentId) {
                const subResult: ContentBlock[] = []
                for (const subContentId of contentId) {
                    if (typeof subContentId === 'string') {
                        const subContent = contents.find((c) => c.id === subContentId)
                        if (subContent) {
                            subResult.push(subContent)
                        }
                    }
                }
                result.push(subResult)
            }
        }
        return result
    },
)

export function getLastCardContent(cardId: string): (state: RootState) => ContentBlock|undefined {
    return (state: RootState): ContentBlock|undefined => {
        const contents = state.contents?.contentsByCard && state.contents?.contentsByCard[cardId]
        return contents?.[contents?.length - 1]
    }
}
