// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IBlock, MutableBlock} from './blocks/block'
import {IPropertyTemplate, MutableBoard} from './blocks/board'
import {MutableBoardView} from './blocks/boardView'
import {MutableCard} from './blocks/card'
import {MutableCommentBlock} from './blocks/commentBlock'
import {MutableDividerBlock} from './blocks/dividerBlock'
import {MutableImageBlock} from './blocks/imageBlock'
import {IOrderedBlock} from './blocks/orderedBlock'
import {MutableTextBlock} from './blocks/textBlock'
import {Utils} from './utils'

class OctoUtils {
    static propertyDisplayValue(block: IBlock, propertyValue: string | undefined, propertyTemplate: IPropertyTemplate): string | undefined {
        let displayValue: string | undefined
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
            displayValue = Utils.displayDateTime(new Date(block.createAt))
            break
        }
        case 'updatedTime': {
            displayValue = Utils.displayDateTime(new Date(block.updateAt))
            break
        }
        default:
            displayValue = propertyValue
        }

        return displayValue
    }

    static getOrderBefore(block: IOrderedBlock, blocks: readonly IOrderedBlock[]): number {
        const index = blocks.indexOf(block)
        if (index === 0) {
            return block.order / 2
        }
        const previousBlock = blocks[index - 1]
        return (block.order + previousBlock.order) / 2
    }

    static getOrderAfter(block: IOrderedBlock, blocks: readonly IOrderedBlock[]): number {
        const index = blocks.indexOf(block)
        if (index === blocks.length - 1) {
            return block.order + 1000
        }
        const nextBlock = blocks[index + 1]
        return (block.order + nextBlock.order) / 2
    }

    static hydrateBlock(block: IBlock): MutableBlock {
        switch (block.type) {
        case 'board': { return new MutableBoard(block) }
        case 'view': { return new MutableBoardView(block) }
        case 'card': { return new MutableCard(block) }
        case 'text': { return new MutableTextBlock(block) }
        case 'image': { return new MutableImageBlock(block) }
        case 'divider': { return new MutableDividerBlock(block) }
        case 'comment': { return new MutableCommentBlock(block) }
        default: {
            Utils.assertFailure(`Can't hydrate unknown block type: ${block.type}`)
            return new MutableBlock(block)
        }
        }
    }

    static hydrateBlocks(blocks: IBlock[]): MutableBlock[] {
        return blocks.map((block) => this.hydrateBlock(block))
    }

    static mergeBlocks(blocks: IBlock[], updatedBlocks: IBlock[]): IBlock[] {
        const updatedBlockIds = updatedBlocks.map((o) => o.id)
        const newBlocks = blocks.filter((o) => !updatedBlockIds.includes(o.id))
        const updatedAndNotDeletedBlocks = updatedBlocks.filter((o) => o.deleteAt === 0)
        newBlocks.push(...updatedAndNotDeletedBlocks)
        return newBlocks
    }

    // Creates a copy of the blocks with new ids and parentIDs
    static duplicateBlockTree(blocks: IBlock[], rootBlockId: string): [MutableBlock[], MutableBlock, Readonly<Record<string, string>>] {
        const idMap: Record<string, string> = {}
        const newBlocks = blocks.map((block) => {
            const newBlock = this.hydrateBlock(block)
            newBlock.id = Utils.createGuid()
            idMap[block.id] = newBlock.id
            return newBlock
        })

        const newRootBlockId = idMap[rootBlockId]
        newBlocks.forEach((newBlock) => {
            // Note: Don't remap the parent of the new root block
            if (newBlock.id !== newRootBlockId && newBlock.parentId) {
                newBlock.parentId = idMap[newBlock.parentId] || newBlock.parentId
                Utils.assert(newBlock.parentId, `Block ${newBlock.id} (${newBlock.type} ${newBlock.title}) has no parent`)
            }

            // Remap manual card order
            if (newBlock.type === 'view') {
                const view = newBlock as MutableBoardView
                view.cardOrder = view.cardOrder.map((o) => idMap[o])
            }
        })

        const newRootBlock = newBlocks.find((block) => block.id === newRootBlockId)!
        return [newBlocks, newRootBlock, idMap]
    }
}

export {OctoUtils}
