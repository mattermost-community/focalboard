// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Utils} from '../utils'

const contentBlockTypes = ['text', 'image', 'divider', 'checkbox'] as const
const blockTypes = [...contentBlockTypes, 'board', 'view', 'card', 'comment', 'unknown'] as const
type ContentBlockTypes = typeof contentBlockTypes[number]
type BlockTypes = typeof blockTypes[number]

interface BlockPatch {
    workspaceId?: string
    parentId?: string
    rootId?: string
    schema?: number
    type?: BlockTypes
    title?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatedFields?: Record<string, any>
    deletedFields?: string[]
    deleteAt?: number
}

interface Block {
    id: string
    workspaceId: string
    parentId: string
    rootId: string
    createdBy: string
    modifiedBy: string

    schema: number
    type: BlockTypes
    title: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fields: Record<string, any>

    createAt: number
    updateAt: number
    deleteAt: number
}

function createBlock(block?: Block): Block {
    const now = Date.now()
    return {
        id: block?.id || Utils.createGuid(Utils.blockTypeToIDType(block?.type)),
        schema: 1,
        workspaceId: block?.workspaceId || '',
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

// createPatchesFromBlock creates two BlockPatch instances, one that
// contains the delta to update the block and another one for the undo
// action, in case it happens
function createPatchesFromBlocks(newBlock: Block, oldBlock: Block): BlockPatch[] {
    const oldDeletedFields = [] as string[]
    const newUpdatedFields = Object.keys(newBlock.fields).reduce((acc, val): Record<string, any> => {
        // the field is in both old and new, so it is part of the new
        // patch
        if (val in oldBlock.fields) {
            acc[val] = newBlock.fields[val]
        } else {
            // the field is only in the new block, so we set it to be
            // removed in the undo patch
            oldDeletedFields.push(val)
        }
        return acc
    }, {} as Record<string, any>)

    const newDeletedFields = [] as string[]
    const oldUpdatedFields = Object.keys(oldBlock.fields).reduce((acc, val): Record<string, any> => {
        // the field is in both, so in this case we set the old one to
        // be applied for the undo patch
        if (val in newBlock.fields) {
            acc[val] = oldBlock.fields[val]
        } else {
            // the field is only on the old block, which means the
            // update patch should remove it
            newDeletedFields.push(val)
        }
        return acc
    }, {} as Record<string, any>)

    // ToDo: add tests
    return [
        {
            ...newBlock as BlockPatch,
            updatedFields: newUpdatedFields,
            deletedFields: oldDeletedFields,
        },
        {
            ...oldBlock as BlockPatch,
            updatedFields: oldUpdatedFields,
            deletedFields: newDeletedFields,
        },
    ]
}

export type {ContentBlockTypes, BlockTypes}
export {blockTypes, contentBlockTypes, Block, BlockPatch, createBlock, createPatchesFromBlocks}
