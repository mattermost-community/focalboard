// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Utils} from '../utils'

import {Block, IBlock} from './block'
import {Card} from './card'

type PropertyType = 'text' | 'number' | 'select' | 'multiSelect' | 'date' | 'person' | 'file' | 'checkbox' | 'url' | 'email' | 'phone' | 'createdTime' | 'createdBy' | 'updatedTime' | 'updatedBy'

interface IPropertyOption {
    id: string
    value: string
    color: string
}

// A template for card properties attached to a board
interface IPropertyTemplate {
    id: string
    name: string
    type: PropertyType
    options: IPropertyOption[]
}

type BoardFields = {
    icon: string
    description: string
    showDescription?: boolean
    isTemplate?: boolean
    cardProperties: IPropertyTemplate[]
}

class Board extends Block {
    fields: BoardFields

    constructor(block?: IBlock) {
        super(block)
        this.type = 'board'

        let cardProperties: IPropertyTemplate[] = []
        if (block?.fields.cardProperties) {
            // Deep clone of card properties and their options
            cardProperties = block?.fields.cardProperties.map((o: IPropertyTemplate) => {
                return {
                    id: o.id,
                    name: o.name,
                    type: o.type,
                    options: o.options ? o.options.map((option) => ({...option})) : [],
                }
            })
        }

        const selectProperties = cardProperties.find((o) => o.type === 'select')
        if (!selectProperties) {
            const property: IPropertyTemplate = {
                id: Utils.createGuid(),
                name: 'Status',
                type: 'select',
                options: [],
            }
            cardProperties.push(property)
        }

        this.fields = {
            showDescription: block?.fields.showDescription || false,
            description: block?.fields.description || '',
            icon: block?.fields.icon || '',
            isTemplate: block?.fields.isTemplate || false,
            cardProperties,
        }
    }

    duplicate(): Board {
        const board = new Board(this)
        board.id = Utils.createGuid()
        return board
    }
}

type BoardGroup = {
    option: IPropertyOption
    cards: Card[]
}

export {Board, PropertyType, IPropertyOption, IPropertyTemplate, BoardGroup}
