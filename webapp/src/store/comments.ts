// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, PayloadAction} from '@reduxjs/toolkit'

import {CommentBlock} from '../blocks/commentBlock'

import {initialLoad, initialReadOnlyLoad} from './initialLoad'

import {RootState} from './index'

const commentsSlice = createSlice({
    name: 'comments',
    initialState: {comments: {}} as {comments: {[key: string]: CommentBlock}},
    reducers: {
        updateComments: (state, action: PayloadAction<CommentBlock[]>) => {
            for (const comment of action.payload) {
                if (comment.deleteAt === 0) {
                    state.comments[comment.id] = comment
                } else {
                    delete state.comments[comment.id]
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(initialReadOnlyLoad.fulfilled, (state, action) => {
            state.comments = {}
            for (const block of action.payload) {
                if (block.type === 'comment') {
                    state.comments[block.id] = block as CommentBlock
                }
            }
        })
        builder.addCase(initialLoad.fulfilled, (state, action) => {
            state.comments = {}
            for (const block of action.payload.blocks) {
                if (block.type === 'comment') {
                    state.comments[block.id] = block as CommentBlock
                }
            }
        })
    },
})

export const {updateComments} = commentsSlice.actions
export const {reducer} = commentsSlice

export function getComments(state: RootState): CommentBlock[] {
    return Object.values(state.comments.comments).sort((a, b) => a.title.localeCompare(b.title)) as CommentBlock[]
}

export function getCardComments(cardId: string): (state: RootState) => CommentBlock[] {
    return (state: RootState): CommentBlock[] => {
        return Object.values(state.comments.comments).filter((c) => c.parentId === cardId)
    }
}
