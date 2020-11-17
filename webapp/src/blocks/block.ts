// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Utils} from '../utils'

type BlockTypes = 'board' | 'view' | 'card' | 'text' | 'image' | 'divider' | 'comment'

interface IBlock {
    readonly id: string
    readonly parentId: string

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
    type: BlockTypes
    title: string
    fields: Record<string, any> = {}
    createAt: number = Date.now()
    updateAt = 0
    deleteAt = 0

    static duplicate(block: IBlock): IMutableBlock {
        const now = Date.now()

        const newBlock = new MutableBlock(block)
        newBlock.id = Utils.createGuid()
        newBlock.createAt = now
        newBlock.updateAt = now
        newBlock.deleteAt = 0

        return newBlock
    }

    constructor(block: any = {}) {
        this.id = block.id || Utils.createGuid()
        this.schema = 1
        this.parentId = block.parentId || ''
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

export {IBlock, IMutableBlock, MutableBlock}
