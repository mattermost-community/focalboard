// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {IBlock, MutableBlock} from './blocks/block'
import {IPropertyTemplate, MutableBoard} from './blocks/board'
import {MutableBoardView} from './blocks/boardView'
import {MutableCard} from './blocks/card'
import {MutableCommentBlock} from './blocks/commentBlock'
import {MutableImageBlock} from './blocks/imageBlock'
import {IOrderedBlock} from './blocks/orderedBlock'
import {MutableTextBlock} from './blocks/textBlock'
import {Utils} from './utils'

class OctoUtils {
    static propertyDisplayValue(block: IBlock, propertyValue: string | undefined, propertyTemplate: IPropertyTemplate): string | undefined {
        let displayValue: string
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
}

export {OctoUtils}
