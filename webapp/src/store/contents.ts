// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, PayloadAction, createSelector} from '@reduxjs/toolkit'

import {ContentBlock} from '../blocks/contentBlock'

import {getCards} from './cards'
import {initialLoad, initialReadOnlyLoad} from './initialLoad'

import {RootState} from './index'

const contentsSlice = createSlice({
    name: 'contents',
    initialState: {contents: {}} as {contents: {[key: string]: ContentBlock}},
    reducers: {
        updateContents: (state, action: PayloadAction<ContentBlock[]>) => {
            for (const content of action.payload) {
                if (content.deleteAt === 0) {
                    state.contents[content.id] = content
                } else {
                    delete state.contents[content.id]
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(initialReadOnlyLoad.fulfilled, (state, action) => {
            state.contents = {}
            for (const block of action.payload) {
                if (block.type !== 'board' && block.type !== 'view' && block.type !== 'comment') {
                    state.contents[block.id] = block as ContentBlock
                }
            }
        })
        builder.addCase(initialLoad.fulfilled, (state, action) => {
            state.contents = {}
            for (const block of action.payload.blocks) {
                if (block.type !== 'board' && block.type !== 'view' && block.type !== 'comment') {
                    state.contents[block.id] = block as ContentBlock
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
        getContentsById,
        getCards,
        (contents, cards): Array<ContentBlock|ContentBlock[]> => {
            const card = cards[cardId]
            const result: Array<ContentBlock|ContentBlock[]> = []
            if (card?.fields?.contentOrder) {
                for (const contentId of card.fields.contentOrder) {
                    if (typeof contentId === 'string' && contents[contentId]) {
                        result.push(contents[contentId])
                    } else if (typeof contentId === 'object') {
                        const subResult: ContentBlock[] = []
                        for (const subContentId of contentId) {
                            if (typeof subContentId === 'string' && contents[subContentId]) {
                                subResult.push(contents[subContentId])
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
