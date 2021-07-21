// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, PayloadAction} from '@reduxjs/toolkit'

import {ContentBlock} from '../blocks/contentBlock'

import {initialLoad} from './initialLoad'

import {RootState} from './index'

const contentsSlice = createSlice({
    name: 'contents',
    initialState: {contents: []} as {contents: ContentBlock[]},
    reducers: {
        updateContents: (state, action: PayloadAction<ContentBlock[]>) => {
            const updatedContentIds = action.payload.map((o: ContentBlock) => o.id)
            const newContents = state.contents.filter((o: ContentBlock) => !updatedContentIds.includes(o.id))
            const updatedAndNotDeletedContents = action.payload.filter((o: ContentBlock) => o.deleteAt === 0 && !o.fields.isTemplate)
            newContents.push(...updatedAndNotDeletedContents)
            state.contents = newContents.sort((a, b) => a.title.localeCompare(b.title)) as ContentBlock[]
        },
    },
    extraReducers: (builder) => {
        builder.addCase(initialLoad.fulfilled, (state, action) => {
            state.contents = action.payload.blocks.filter((block) => block.type !== 'board' && block.type !== 'view')
        })
    },
})

export const {updateContents} = contentsSlice.actions
export const {reducer} = contentsSlice

export function getContents(state: RootState): ContentBlock[] {
    return state.contents.contents
}

export function getCardContents(cardId: string): (state: RootState) => ContentBlock[] {
    return (state: RootState): ContentBlock[] => {
        return state.contents.contents.filter((c) => c.parentId === cardId)
    }
}
