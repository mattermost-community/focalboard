// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Utils} from '../utils'

import {Block, createBlock} from './block'
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

type Board = Block & {
    fields: BoardFields
}

function createBoard(block?: Block): Board {
    let cardProperties: IPropertyTemplate[] = []
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

    return {
        ...createBlock(block),
        type: 'board',
        fields: {
            showDescription: block?.fields.showDescription || false,
            description: block?.fields.description || '',
            icon: block?.fields.icon || '',
            isTemplate: block?.fields.isTemplate || false,
            columnCalculations: block?.fields.columnCalculations || [],
            cardProperties,
        },
    }
}

type BoardGroup = {
    option: IPropertyOption
    cards: Card[]
}

export {Board, PropertyType, IPropertyOption, IPropertyTemplate, BoardGroup, createBoard}
