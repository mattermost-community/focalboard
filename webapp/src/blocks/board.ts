// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Utils, IDType} from '../utils'

import {Block, createBlock} from './block'
import {Card} from './card'





// ----------------------------------------------------------------
// -         NEW
// ----------------------------------------------------------------

const boardTypes = ['O', 'P']
type BoardTypes = typeof boardTypes[number]

type Board = {
    id: string
    teamId: string
    channelId?: string
    createdBy: string
    modifiedBy: string
    type: BoardTypes

    title: string
    description: string
    icon?: string
    showDescription: boolean
    isTemplate: boolean
    properties: Record<string, string | string[]>
    cardProperties: IPropertyTemplate[]
    columnCalculations: Record<string, string>

    createAt: number
    updateAt: number
    deleteAt: number
}

type BoardMember = {
    boardId: string
    userId: string
    roles?: string
    schemeAdmin: boolean
    schemeEditor: boolean
    schemeCommenter: boolean
    schemeViewer: boolean
}

// ----------------------------------------------------------------



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
    columnCalculations: Record<string, string>
}

// type Board = Block & {
//     fields: BoardFields
// }
//
function createBoard(board?: Board): Board {
    const now = Date.now()
    let cardProperties: IPropertyTemplate[] = []
    const selectProperties = cardProperties.find((o) => o.type === 'select')
    if (!selectProperties) {
        const property: IPropertyTemplate = {
            id: Utils.createGuid(IDType.BlockID),
            name: 'Status',
            type: 'select',
            options: [],
        }
        cardProperties.push(property)
    }

    if (board?.cardProperties) {
        // Deep clone of card properties and their options
        cardProperties = board?.cardProperties.map((o: IPropertyTemplate) => {
            return {
                id: o.id,
                name: o.name,
                type: o.type,
                options: o.options ? o.options.map((option) => ({...option})) : [],
            }
        })
    }

    return {
        id: board?.id || '',
        teamId: board?.teamId || '',
        channelId: board?.channelId || '',
        createdBy: board?.createdBy || '',
        modifiedBy: board?.modifiedBy || '',
        type: board?.type || 'P',
        title: board?.title || '',
        description: board?.description || '',
        icon: board?.icon || '',
        showDescription: board?.showDescription || false,
        isTemplate: board?.isTemplate || false,
        properties: board?.properties || {},
        cardProperties,
        columnCalculations: board?.columnCalculations || {},
        createAt: board?.createAt || now,
        updateAt: board?.updateAt || now,
        deleteAt: board?.deleteAt || 0,
    }
}

type BoardGroup = {
    option: IPropertyOption
    cards: Card[]
}

export {Board, BoardMember, PropertyType, IPropertyOption, IPropertyTemplate, BoardGroup, createBoard}
