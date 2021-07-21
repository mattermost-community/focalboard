// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {IntlShape} from 'react-intl'

import {IBlock, Block} from './blocks/block'
import {IPropertyTemplate, Board} from './blocks/board'
import {BoardView} from './blocks/boardView'
import {Card} from './blocks/card'
import {CommentBlock} from './blocks/commentBlock'
import {CheckboxBlock} from './blocks/checkboxBlock'
import {DividerBlock} from './blocks/dividerBlock'
import {ImageBlock} from './blocks/imageBlock'
import {TextBlock} from './blocks/textBlock'
import {FilterCondition} from './blocks/filterClause'
import {Utils} from './utils'
import {UserSettings} from './userSettings'

class OctoUtils {
    static propertyDisplayValue(block: IBlock, propertyValue: string | string[] | undefined, propertyTemplate: IPropertyTemplate, intl: IntlShape): string | string[] | undefined {
        let displayValue: string | string[] | undefined
        switch (propertyTemplate.type) {
        case 'select': {
            // The property value is the id of the template
            if (propertyValue) {
                const option = propertyTemplate.options.find((o) => o.id === propertyValue)
                if (!option) {
                    Utils.assertFailure(`Invalid select option ID ${propertyValue}, block.title: ${block.title}`)
                }
                displayValue = option?.value || '(Unknown)'
            }
            break
        }
        case 'createdTime': {
            displayValue = Utils.displayDateTime(new Date(block.createAt), intl)
            break
        }
        case 'updatedTime': {
            displayValue = Utils.displayDateTime(new Date(block.updateAt), intl)
            break
        }
        case 'date': {
            if (propertyValue) {
                displayValue = Utils.displayDate(new Date(parseInt(propertyValue as string, 10)), intl, UserSettings.preferredDateFormat)
            }
            break
        }
        default:
            displayValue = propertyValue
        }

        return displayValue
    }

    static hydrateBlock(block: IBlock): Block {
        switch (block.type) {
        case 'board': { return new Board(block) }
        case 'view': { return new BoardView(block) }
        case 'card': { return new Card(block) }
        case 'text': { return new TextBlock(block) }
        case 'image': { return new ImageBlock(block) }
        case 'divider': { return new DividerBlock(block) }
        case 'comment': { return new CommentBlock(block) }
        case 'checkbox': { return new CheckboxBlock(block) }
        default: {
            Utils.assertFailure(`Can't hydrate unknown block type: ${block.type}`)
            return new Block(block)
        }
        }
    }

    static hydrateBlocks(blocks: readonly IBlock[]): Block[] {
        return blocks.map((block) => this.hydrateBlock(block))
    }

    static mergeBlocks(blocks: readonly IBlock[], updatedBlocks: readonly IBlock[]): IBlock[] {
        const updatedBlockIds = updatedBlocks.map((o) => o.id)
        const newBlocks = blocks.filter((o) => !updatedBlockIds.includes(o.id))
        const updatedAndNotDeletedBlocks = updatedBlocks.filter((o) => o.deleteAt === 0)
        newBlocks.push(...updatedAndNotDeletedBlocks)
        return newBlocks
    }

    // Creates a copy of the blocks with new ids and parentIDs
    static duplicateBlockTree(blocks: readonly IBlock[], sourceBlockId: string): [Block[], Block, Readonly<Record<string, string>>] {
        const idMap: Record<string, string> = {}
        const now = Date.now()
        const newBlocks = blocks.map((block) => {
            const newBlock = this.hydrateBlock(block)
            newBlock.id = Utils.createGuid()
            newBlock.createAt = now
            newBlock.updateAt = now
            idMap[block.id] = newBlock.id
            return newBlock
        })

        const newSourceBlockId = idMap[sourceBlockId]

        // Determine the new rootId if needed
        let newRootId: string
        const sourceBlock = blocks.find((block) => block.id === sourceBlockId)!
        if (sourceBlock.rootId === sourceBlock.id) {
            // Special case: when duplicating a tree from root, remap all the descendant rootIds
            const newSourceRootBlock = newBlocks.find((block) => block.id === newSourceBlockId)!
            newRootId = newSourceRootBlock.id
        }

        newBlocks.forEach((newBlock) => {
            // Note: Don't remap the parent of the new root block
            if (newBlock.id !== newSourceBlockId && newBlock.parentId) {
                newBlock.parentId = idMap[newBlock.parentId] || newBlock.parentId
                Utils.assert(newBlock.parentId, `Block ${newBlock.id} (${newBlock.type} ${newBlock.title}) has no parent`)
            }

            // Remap the rootIds if we are duplicating a tree from root
            if (newRootId) {
                newBlock.rootId = newRootId
            }

            // Remap manual card order
            if (newBlock.type === 'view') {
                const view = newBlock as BoardView
                view.fields.cardOrder = view.fields.cardOrder.map((o) => idMap[o])
            }

            // Remap card content order
            if (newBlock.type === 'card') {
                const card = newBlock as Card
                card.fields.contentOrder = card.fields.contentOrder.map((o) => (Array.isArray(o) ? o.map((o2) => idMap[o2]) : idMap[o]))
            }
        })

        const newSourceBlock = newBlocks.find((block) => block.id === newSourceBlockId)!
        return [newBlocks, newSourceBlock, idMap]
    }

    static filterConditionDisplayString(filterCondition: FilterCondition, intl: IntlShape): string {
        switch (filterCondition) {
        case 'includes': return intl.formatMessage({id: 'Filter.includes', defaultMessage: 'includes'})
        case 'notIncludes': return intl.formatMessage({id: 'Filter.not-includes', defaultMessage: 'doesn\'t include'})
        case 'isEmpty': return intl.formatMessage({id: 'Filter.is-empty', defaultMessage: 'is empty'})
        case 'isNotEmpty': return intl.formatMessage({id: 'Filter.is-not-empty', defaultMessage: 'is not empty'})
        default: {
            Utils.assertFailure()
            return '(unknown)'
        }
        }
    }
}

export {OctoUtils}
