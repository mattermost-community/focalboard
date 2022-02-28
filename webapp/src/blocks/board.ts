// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import difference from 'lodash/difference'

import {Utils, IDType} from '../utils'

import {Block, BlockPatch, createPatchesFromBlocks} from './block'
import {Card} from './card'

const BoardTypeOpen = 'O'
const BoardTypePrivate = 'P'
const boardTypes = [BoardTypeOpen, BoardTypePrivate]
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
    templateVersion: number
    properties: Record<string, string | string[]>
    cardProperties: IPropertyTemplate[]
    columnCalculations: Record<string, string>

    createAt: number
    updateAt: number
    deleteAt: number
}

type BoardPatch = {
    type?: BoardTypes
    title?: string
    description?: string
    icon?: string
    showDescription?: boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatedProperties?: Record<string, any>
    deletedProperties?: string[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatedCardProperties?: IPropertyTemplate[]
    deletedCardProperties?: string[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatedColumnCalculations?: Record<string, any>
    deletedColumnCalculations?: string[]
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

type BoardsAndBlocks = {
    boards: Board[],
    blocks: Block[],
}

type BoardsAndBlocksPatch = {
    boardIDs: string[],
    boardPatches: BoardPatch[],
    blockIDs: string[],
    blockPatches: BlockPatch[],
}

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
        id: board?.id || Utils.createGuid(IDType.Board),
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
        templateVersion: board?.templateVersion || 0,
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

// getPropertiesDifference returns a list of the property IDs that are
// contained in propsA but are not contained in propsB
function getPropertiesDifference(propsA: IPropertyTemplate[], propsB: IPropertyTemplate[]): string[] {
    const diff: string[] = []
    propsA.forEach((val) => {
        if (!propsB.find((p) => p.id === val.id)) {
            diff.push(val.id)
        }
    })

    return diff
}

// isPropertyEqual checks that both the contents of the property and
// its options are equal
function isPropertyEqual(propA: IPropertyTemplate, propB: IPropertyTemplate): boolean {
    for (const val of Object.keys(propA)) {
        if (val !== 'options' && (propA as any)[val] !== (propB as any)[val]) {
            return false
        }
    }

    if (propA.options.length !== propB.options.length) {
        return false
    }

    for (const opt of propA.options) {
        const optionB = propB.options.find((o) => o.id === opt.id)
        if (!optionB) {
            return false
        }

        for (const val of Object.keys(opt)) {
            if ((opt as any)[val] !== (optionB as any)[val]) {
                return false
            }
        }
    }

    return true
}

// createPatchesFromBoards creates two BoardPatch instances, one that
// contains the delta to update the board and another one for the undo
// action, in case it happens
function createPatchesFromBoards(newBoard: Board, oldBoard: Board): BoardPatch[] {
    const newDeletedProperties = difference(Object.keys(newBoard.properties), Object.keys(oldBoard.properties))
    const newDeletedCardProperties = getPropertiesDifference(newBoard.cardProperties, oldBoard.cardProperties)
    const newDeletedColumnCalculations = difference(Object.keys(newBoard.columnCalculations), Object.keys(oldBoard.columnCalculations))

    const newUpdatedProperties: Record<string, any> = {}
    Object.keys(newBoard.properties).forEach((val) => {
        if (oldBoard.properties[val] !== newBoard.properties[val]) {
            newUpdatedProperties[val] = newBoard.properties[val]
        }
    })
    const newUpdatedCardProperties: IPropertyTemplate[] = []
    newBoard.cardProperties.forEach((val) => {
        const oldCardProperty = oldBoard.cardProperties.find((o) => o.id === val.id)
        if (!oldCardProperty || !isPropertyEqual(val, oldCardProperty)) {
            newUpdatedCardProperties.push(val)
        }
    })
    const newUpdatedColumnCalculations: Record<string, any> = {}
    Object.keys(newBoard.columnCalculations).forEach((val) => {
        if (oldBoard.columnCalculations[val] !== newBoard.columnCalculations[val]) {
            newUpdatedColumnCalculations[val] = newBoard.columnCalculations[val]
        }
    })

    const newData: Record<string, any> = {}
    Object.keys(newBoard).forEach((val) => {
        if (val !== 'properties' &&
            val !== 'cardProperties' &&
            val !== 'columnCalculations' &&
            (oldBoard as any)[val] !== (newBoard as any)[val]) {
            newData[val] = (newBoard as any)[val]
        }
    })

    const oldDeletedProperties = difference(Object.keys(oldBoard.properties), Object.keys(newBoard.properties))
    const oldDeletedCardProperties = getPropertiesDifference(oldBoard.cardProperties, newBoard.cardProperties)
    const oldDeletedColumnCalculations = difference(Object.keys(oldBoard.columnCalculations), Object.keys(newBoard.columnCalculations))

    const oldUpdatedProperties: Record<string, any> = {}
    Object.keys(oldBoard.properties).forEach((val) => {
        if (newBoard.properties[val] !== oldBoard.properties[val]) {
            oldUpdatedProperties[val] = oldBoard.properties[val]
        }
    })
    const oldUpdatedCardProperties: IPropertyTemplate[] = []
    oldBoard.cardProperties.forEach((val) => {
        const newCardProperty = newBoard.cardProperties.find((o) => o.id === val.id)
        if (!newCardProperty || !isPropertyEqual(val, newCardProperty)) {
            oldUpdatedCardProperties.push(val)
        }
    })
    const oldUpdatedColumnCalculations: Record<string, any> = {}
    Object.keys(oldBoard.columnCalculations).forEach((val) => {
        if (newBoard.columnCalculations[val] !== oldBoard.columnCalculations[val]) {
            oldUpdatedColumnCalculations[val] = oldBoard.columnCalculations[val]
        }
    })

    const oldData: Record<string, any> = {}
    Object.keys(oldBoard).forEach((val) => {
        if (val !== 'properties' &&
            val !== 'cardProperties' &&
            val !== 'columnCalculations' &&
            (newBoard as any)[val] !== (oldBoard as any)[val]) {
            oldData[val] = (oldBoard as any)[val]
        }
    })

    return [
        {
            ...newData,
            updatedProperties: newUpdatedProperties,
            deletedProperties: oldDeletedProperties,
            updatedCardProperties: newUpdatedCardProperties,
            deletedCardProperties: oldDeletedCardProperties,
            updatedColumnCalculations: newUpdatedColumnCalculations,
            deletedColumnCalculations: oldDeletedColumnCalculations,
        },
        {
            ...oldData,
            updatedProperties: oldUpdatedProperties,
            deletedProperties: newDeletedProperties,
            updatedCardProperties: oldUpdatedCardProperties,
            deletedCardProperties: newDeletedCardProperties,
            updatedColumnCalculations: oldUpdatedColumnCalculations,
            deletedColumnCalculations: newDeletedColumnCalculations,
        },
    ]
}

function createPatchesFromBoardsAndBlocks(updatedBoard: Board, oldBoard: Board, updatedBlockIDs: string[], updatedBlocks: Block[], oldBlocks: Block[]): BoardsAndBlocksPatch[] {
    const blockUpdatePatches = [] as BlockPatch[]
    const blockUndoPatches = [] as BlockPatch[]
    updatedBlocks.forEach((newBlock, i) => {
        const [updatePatch, undoPatch] = createPatchesFromBlocks(newBlock, oldBlocks[i])
        blockUpdatePatches.push(updatePatch)
        blockUndoPatches.push(undoPatch)
    })

    const [boardUpdatePatch, boardUndoPatch] = createPatchesFromBoards(updatedBoard, oldBoard)

    const updatePatch: BoardsAndBlocksPatch = {
        blockIDs: updatedBlockIDs,
        blockPatches: blockUpdatePatches,
        boardIDs: [updatedBoard.id],
        boardPatches: [boardUpdatePatch],
    }

    const undoPatch: BoardsAndBlocksPatch = {
        blockIDs: updatedBlockIDs,
        blockPatches: blockUndoPatches,
        boardIDs: [updatedBoard.id],
        boardPatches: [boardUndoPatch],
    }

    return [updatePatch, undoPatch]
}

export {
    Board,
    BoardPatch,
    BoardMember,
    BoardsAndBlocks,
    BoardsAndBlocksPatch,
    PropertyType,
    IPropertyOption,
    IPropertyTemplate,
    BoardGroup,
    createBoard,
    BoardTypes,
    BoardTypeOpen,
    BoardTypePrivate,
    createPatchesFromBoards,
    createPatchesFromBoardsAndBlocks,
}
