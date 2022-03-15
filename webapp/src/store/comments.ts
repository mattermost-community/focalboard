// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, PayloadAction} from '@reduxjs/toolkit'

import {CommentBlock} from '../blocks/commentBlock'

import {loadBoardData, initialReadOnlyLoad} from './initialLoad'

import {RootState} from './index'

type CommentsState = {
    comments: {[key: string]: CommentBlock}
    commentsByCard: {[key: string]: CommentBlock[]}
}

const commentsSlice = createSlice({
    name: 'comments',
    initialState: {comments: {}, commentsByCard: {}} as CommentsState,
    reducers: {
        updateComments: (state, action: PayloadAction<CommentBlock[]>) => {
            for (const comment of action.payload) {
                if (comment.deleteAt === 0) {
                    state.comments[comment.id] = comment
                    for (let i = 0; i < state.commentsByCard[comment.parentId].length; i++) {
                        if (state.commentsByCard[comment.parentId][i].id === comment.id) {
                            state.commentsByCard[comment.parentId][i] = comment
                        }
                    }
                } else {
                    delete state.comments[comment.id]
                    for (let i = 0; i < state.commentsByCard[comment.parentId].length; i++) {
                        state.commentsByCard[comment.parentId].splice(i, 1)
                    }
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
                    state.commentsByCard[block.parentId] = state.commentsByCard[block.id] || []
                    state.commentsByCard[block.parentId].push(block as CommentBlock)
                    state.commentsByCard[block.parentId].sort((a, b) => a.createAt - b.createAt)
                }
            }
        })
        builder.addCase(loadBoardData.fulfilled, (state, action) => {
            state.comments = {}
            for (const block of action.payload.blocks) {
                if (block.type === 'comment') {
                    state.comments[block.id] = block as CommentBlock
                    state.commentsByCard[block.parentId] = state.commentsByCard[block.id] || []
                    state.commentsByCard[block.parentId].push(block as CommentBlock)
                    state.commentsByCard[block.parentId].sort((a, b) => a.createAt - b.createAt)
                }
            }
        })
    },
})

export const {updateComments} = commentsSlice.actions
export const {reducer} = commentsSlice

export function getCardComments(cardId: string): (state: RootState) => CommentBlock[] {
    return (state: RootState): CommentBlock[] => {
        return state.comments.commentsByCard[cardId] || []
    }
}

export function getLastComment(cardId: string): (state: RootState) => CommentBlock|undefined {
    return (state: RootState): CommentBlock|undefined => {
        const comments = state.comments.commentsByCard[cardId]
        return comments?.[comments?.length - 1]
    }
}
