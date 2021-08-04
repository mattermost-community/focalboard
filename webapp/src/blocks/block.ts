// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Utils} from '../utils'

const contentBlockTypes = ['text', 'image', 'divider', 'checkbox'] as const
const blockTypes = [...contentBlockTypes, 'board', 'view', 'card', 'comment', 'unknown'] as const
type ContentBlockTypes = typeof contentBlockTypes[number]
type BlockTypes = typeof blockTypes[number]

interface Block {
    id: string
    parentId: string
    rootId: string
    createdBy: string
    modifiedBy: string

    schema: number
    type: BlockTypes
    title: string
    fields: Record<string, any>

    createAt: number
    updateAt: number
    deleteAt: number
}

function createBlock(block?: Block): Block {
    const now = Date.now()
    return {
        id: block?.id || Utils.createGuid(),
        schema: 1,
        parentId: block?.parentId || '',
        rootId: block?.rootId || '',
        createdBy: block?.createdBy || '',
        modifiedBy: block?.modifiedBy || '',
        type: block?.type || 'unknown',
        fields: block?.fields ? {...block?.fields} : {},
        title: block?.title || '',
        createAt: block?.createAt || now,
        updateAt: block?.updateAt || now,
        deleteAt: block?.deleteAt || 0,
    }
}

export type {ContentBlockTypes, BlockTypes}
export {blockTypes, contentBlockTypes, Block, createBlock}
