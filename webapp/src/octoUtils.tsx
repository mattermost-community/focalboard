// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {IntlShape} from 'react-intl'

import {Block, createBlock} from './blocks/block'
import {BoardView, createBoardView} from './blocks/boardView'
import {Card, createCard} from './blocks/card'
import {createCommentBlock} from './blocks/commentBlock'
import {createCheckboxBlock} from './blocks/checkboxBlock'
import {createDividerBlock} from './blocks/dividerBlock'
import {createImageBlock} from './blocks/imageBlock'
import {createTextBlock} from './blocks/textBlock'
import {FilterCondition} from './blocks/filterClause'
import {Utils} from './utils'

class OctoUtils {
    static hydrateBlock(block: Block): Block {
        switch (block.type) {
        case 'view': { return createBoardView(block) }
        case 'card': { return createCard(block) }
        case 'text': { return createTextBlock(block) }
        case 'image': { return createImageBlock(block) }
        case 'divider': { return createDividerBlock(block) }
        case 'comment': { return createCommentBlock(block) }
        case 'checkbox': { return createCheckboxBlock(block) }
        default: {
            Utils.assertFailure(`Can't hydrate unknown block type: ${block.type}`)
            return createBlock(block)
        }
        }
    }

    static hydrateBlocks(blocks: readonly Block[]): Block[] {
        return blocks.map((block) => this.hydrateBlock(block))
    }

    static mergeBlocks(blocks: readonly Block[], updatedBlocks: readonly Block[]): Block[] {
        const updatedBlockIds = updatedBlocks.map((o) => o.id)
        const newBlocks = blocks.filter((o) => !updatedBlockIds.includes(o.id))
        const updatedAndNotDeletedBlocks = updatedBlocks.filter((o) => o.deleteAt === 0)
        newBlocks.push(...updatedAndNotDeletedBlocks)
        return newBlocks
    }

    // Creates a copy of the blocks with new ids and parentIDs
    static duplicateBlockTree(blocks: readonly Block[], sourceBlockId: string): [Block[], Block, Readonly<Record<string, string>>] {
        const idMap: Record<string, string> = {}
        const now = Date.now()
        const newBlocks = blocks.map((block) => {
            const newBlock = this.hydrateBlock(block)
            newBlock.id = Utils.createGuid(Utils.blockTypeToIDType(newBlock.type))
            newBlock.createAt = now
            newBlock.updateAt = now
            idMap[block.id] = newBlock.id
            return newBlock
        })

        const newSourceBlockId = idMap[sourceBlockId]

        // Determine the new boardId if needed
        let newBoardId: string
        const sourceBlock = blocks.find((block) => block.id === sourceBlockId)!
        if (sourceBlock.boardId === sourceBlock.id) {
            // Special case: when duplicating a tree from root, remap all the descendant boardIds
            const newSourceRootBlock = newBlocks.find((block) => block.id === newSourceBlockId)!
            newBoardId = newSourceRootBlock.id
        }

        newBlocks.forEach((newBlock) => {
            // Note: Don't remap the parent of the new root block
            if (newBlock.id !== newSourceBlockId && newBlock.parentId) {
                newBlock.parentId = idMap[newBlock.parentId] || newBlock.parentId
                Utils.assert(newBlock.parentId, `Block ${newBlock.id} (${newBlock.type} ${newBlock.title}) has no parent`)
            }

            // Remap the boardIds if we are duplicating a tree from root
            if (newBoardId) {
                newBlock.boardId = newBoardId
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
        case 'isSet': return intl.formatMessage({id: 'Filter.is-set', defaultMessage: 'is set'})
        case 'isNotSet': return intl.formatMessage({id: 'Filter.is-not-set', defaultMessage: 'is not set'})
        case 'isNotEmpty': return intl.formatMessage({id: 'Filter.is-not-empty', defaultMessage: 'is not empty'})
        case 'is': return intl.formatMessage({id: 'Filter.is', defaultMessage: 'is'})
        case 'contains': return intl.formatMessage({id: 'Filter.contains', defaultMessage: 'contains'})
        case 'notContains': return intl.formatMessage({id: 'Filter.not-contains', defaultMessage: 'doesn\'t contain'})
        case 'startsWith': return intl.formatMessage({id: 'Filter.starts-with', defaultMessage: 'starts with'})
        case 'notStartsWith': return intl.formatMessage({id: 'Filter.not-starts-with', defaultMessage: 'doesn\'t start with'})
        case 'endsWith': return intl.formatMessage({id: 'Filter.ends-with', defaultMessage: 'ends with'})
        case 'notEndsWith': return intl.formatMessage({id: 'Filter.not-ends-with', defaultMessage: 'doesn\'t end with'})
        default: {
            Utils.assertFailure()
            return '(unknown)'
        }
        }
    }
}

export {OctoUtils}
