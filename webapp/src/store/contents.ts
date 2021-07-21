// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, PayloadAction} from '@reduxjs/toolkit'

import {ContentBlock} from '../blocks/contentBlock'

import {initialLoad} from './initialLoad'

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
        builder.addCase(initialLoad.fulfilled, (state, action) => {
            for (const block of action.payload.blocks) {
                if (block.type !== 'board' && block.type !== 'view') {
                    state.contents[block.id] = block as ContentBlock
                }
            }
        })
    },
})

export const {updateContents} = contentsSlice.actions
export const {reducer} = contentsSlice

export function getContents(state: RootState): ContentBlock[] {
    return Object.values(state.contents.contents).sort((a, b) => a.title.localeCompare(b.title)) as ContentBlock[]
}

export function getCardContents(cardId: string): (state: RootState) => ContentBlock[] {
    return (state: RootState): ContentBlock[] => {
        return Object.values(state.contents.contents).filter((c) => c.parentId === cardId)
    }
}
