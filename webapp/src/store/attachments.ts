// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, PayloadAction} from '@reduxjs/toolkit'

import {AttachmentBlock} from '../blocks/attachmentBlock'

import {loadBoardData, initialReadOnlyLoad} from './initialLoad'

import {RootState} from './index'

type AttachmentsState = {
    attachments: {[key: string]: AttachmentBlock}
    attachmentsByCard: {[key: string]: AttachmentBlock[]}
}

const attachmentSlice = createSlice({
    name: 'attachments',
    initialState: {attachments: {}, attachmentsByCard: {}} as AttachmentsState,
    reducers: {
        updateAttachments: (state, action: PayloadAction<AttachmentBlock[]>) => {
            for (const attachment of action.payload) {
                if (attachment.deleteAt === 0) {
                    state.attachments[attachment.id] = attachment
                    if (!state.attachmentsByCard[attachment.parentId]) {
                        state.attachmentsByCard[attachment.parentId] = [attachment]
                        return
                    }
                    for (let i = 0; i < state.attachmentsByCard[attachment.parentId].length; i++) {
                        if (state.attachmentsByCard[attachment.parentId][i].id === attachment.id) {
                            state.attachmentsByCard[attachment.parentId][i] = attachment
                            return
                        }
                    }
                    state.attachmentsByCard[attachment.parentId].push(attachment)
                } else {
                    const parentId = state.attachments[attachment.id]?.parentId
                    if (!state.attachmentsByCard[parentId]) {
                        delete state.attachments[attachment.id]
                        return
                    }
                    for (let i = 0; i < state.attachmentsByCard[parentId].length; i++) {
                        if (state.attachmentsByCard[parentId][i].id === attachment.id) {
                            state.attachmentsByCard[parentId].splice(i, 1)
                        }
                    }
                    delete state.attachments[attachment.id]
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(initialReadOnlyLoad.fulfilled, (state, action) => {
            state.attachments = {}
            state.attachmentsByCard = {}
            for (const block of action.payload.blocks) {
                if (block.type === 'attachment') {
                    state.attachments[block.id] = block as AttachmentBlock
                    state.attachmentsByCard[block.parentId] = state.attachmentsByCard[block.parentId] || []
                    state.attachmentsByCard[block.parentId].push(block as AttachmentBlock)
                    state.attachmentsByCard[block.parentId].sort((a, b) => a.createAt - b.createAt)
                }
            }
        })
        builder.addCase(loadBoardData.fulfilled, (state, action) => {
            state.attachments = {}
            state.attachmentsByCard = {}
            for (const block of action.payload.blocks) {
                if (block.type === 'attachment') {
                    state.attachments[block.id] = block as AttachmentBlock
                    state.attachmentsByCard[block.parentId] = state.attachmentsByCard[block.parentId] || []
                    state.attachmentsByCard[block.parentId].push(block as AttachmentBlock)
                    state.attachmentsByCard[block.parentId].sort((a, b) => a.createAt - b.createAt)
                }
            }
        })
    },
})

export const {updateAttachments} = attachmentSlice.actions
export const {reducer} = attachmentSlice

export function getCardAttachments(cardId: string): (state: RootState) => AttachmentBlock[] {
    return (state: RootState): AttachmentBlock[] => {
        return (state.attachments?.attachmentsByCard && state.attachments.attachmentsByCard[cardId]) || []
    }
}
