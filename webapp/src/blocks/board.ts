// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Utils} from '../utils'

import {IBlock, MutableBlock} from './block'

type PropertyType = 'text' | 'number' | 'select' | 'multiSelect' | 'date' | 'person' | 'file' | 'checkbox' | 'url' | 'email' | 'phone' | 'createdTime' | 'createdBy' | 'updatedTime' | 'updatedBy'

interface IPropertyOption {
    readonly id: string
    readonly value: string
    readonly color: string
}

interface IMutablePropertyOption {
    id: string
    value: string
    color: string
}

// A template for card properties attached to a board
interface IPropertyTemplate {
    readonly id: string
    readonly name: string
    readonly type: PropertyType
    readonly options: IPropertyOption[]
}

interface IMutablePropertyTemplate extends IPropertyTemplate {
    id: string
    name: string
    type: PropertyType
    options: IMutablePropertyOption[]
}

interface Board extends IBlock {
    readonly icon: string
    readonly description: string
    readonly showDescription: boolean
    readonly isTemplate: boolean
    readonly cardProperties: readonly IPropertyTemplate[]
    duplicate(): MutableBoard
}

class MutableBoard extends MutableBlock implements Board {
    get icon(): string {
        return this.fields.icon as string
    }
    set icon(value: string) {
        this.fields.icon = value
    }

    get description(): string {
        return this.fields.description as string
    }
    set description(value: string) {
        this.fields.description = value
    }

    get showDescription(): boolean {
        return Boolean(this.fields.showDescription)
    }
    set showDescription(value: boolean) {
        this.fields.showDescription = value
    }

    get isTemplate(): boolean {
        return Boolean(this.fields.isTemplate)
    }
    set isTemplate(value: boolean) {
        this.fields.isTemplate = value
    }

    get cardProperties(): IMutablePropertyTemplate[] {
        return this.fields.cardProperties as IPropertyTemplate[]
    }
    set cardProperties(value: IMutablePropertyTemplate[]) {
        this.fields.cardProperties = value
    }

    constructor(block: any = {}) {
        super(block)
        this.type = 'board'

        this.icon = block.fields?.icon || ''
        this.description = block.fields?.description || ''
        if (block.fields?.cardProperties) {
            // Deep clone of card properties and their options
            this.cardProperties = block.fields.cardProperties.map((o: IPropertyTemplate) => {
                return {
                    id: o.id,
                    name: o.name,
                    type: o.type,
                    options: o.options ? o.options.map((option) => ({...option})) : [],
                }
            })
        } else {
            this.cardProperties = []
        }
    }

    duplicate(): MutableBoard {
        const board = new MutableBoard(this)
        board.id = Utils.createGuid()
        return board
    }
}

export {Board, MutableBoard, PropertyType, IPropertyOption, IPropertyTemplate}
