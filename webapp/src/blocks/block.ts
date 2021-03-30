// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Utils} from '../utils'

const contentBlockTypes = ['text', 'image', 'divider', 'checkbox'] as const
const blockTypes = [...contentBlockTypes, 'board', 'view', 'card', 'comment'] as const
type ContentBlockTypes = typeof contentBlockTypes[number]
type BlockTypes = typeof blockTypes[number]

interface IBlock {
    readonly id: string
    readonly parentId: string
    readonly rootId: string
    readonly modifiedBy: string

    readonly schema: number
    readonly type: BlockTypes
    readonly title: string
    readonly fields: Readonly<Record<string, any>>

    readonly createAt: number
    readonly updateAt: number
    readonly deleteAt: number
}

interface IMutableBlock extends IBlock {
    id: string
    parentId: string
    rootId: string
    modifiedBy: string

    schema: number
    type: BlockTypes
    title: string
    fields: Record<string, any>

    createAt: number
    updateAt: number
    deleteAt: number
}

class MutableBlock implements IMutableBlock {
    id: string = Utils.createGuid()
    schema: number
    parentId: string
    rootId: string
    modifiedBy: string
    type: BlockTypes
    title: string
    fields: Record<string, any> = {}
    createAt: number = Date.now()
    updateAt = 0
    deleteAt = 0

    constructor(block: any = {}) {
        this.id = block.id || Utils.createGuid()
        this.schema = 1
        this.parentId = block.parentId || ''
        this.rootId = block.rootId || ''
        this.modifiedBy = block.modifiedBy || ''
        this.type = block.type || ''

        // Shallow copy here. Derived classes must make deep copies of their known properties in their constructors.
        this.fields = block.fields ? {...block.fields} : {}

        this.title = block.title || ''

        const now = Date.now()
        this.createAt = block.createAt || now
        this.updateAt = block.updateAt || now
        this.deleteAt = block.deleteAt || 0
    }
}

export type {ContentBlockTypes, BlockTypes}
export {blockTypes, contentBlockTypes, IBlock, IMutableBlock, MutableBlock}
