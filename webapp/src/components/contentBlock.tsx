// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {IOrderedBlock} from '../blocks/orderedBlock'
import {Menu as OldMenu, MenuOption} from '../menu'
import {CardTree} from '../viewModel/cardTree'
import {OctoUtils} from '../octoUtils'
import mutator from '../mutator'
import {Utils} from '../utils'
import {MutableTextBlock} from '../blocks/textBlock'

import {MarkdownEditor} from './markdownEditor'

type Props = {
    block: IOrderedBlock
    cardId: string
    cardTree: CardTree
}

class ContentBlock extends React.Component<Props> {
    shouldComponentUpdate() {
        return true
    }

    componentWillUnmount() {
        OldMenu.shared.hide()
    }

    private showContentBlockMenu(e: React.MouseEvent) {
        const {cardId, cardTree, block} = this.props
        const index = cardTree.contents.indexOf(block)

        const options: MenuOption[] = []
        if (index > 0) {
            options.push({id: 'moveUp', name: 'Move up'})
        }
        if (index < cardTree.contents.length - 1) {
            options.push({id: 'moveDown', name: 'Move down'})
        }

        options.push(
            {id: 'insertAbove', name: 'Insert above', type: 'submenu'},
            {id: 'delete', name: 'Delete'},
        )

        OldMenu.shared.options = options
        OldMenu.shared.subMenuOptions.set('insertAbove', [
            {id: 'text', name: 'Text'},
            {id: 'image', name: 'Image'},
        ])
        OldMenu.shared.onMenuClicked = (optionId: string, type?: string) => {
            switch (optionId) {
            case 'moveUp': {
                if (index < 1) {
                    Utils.logError(`Unexpected index ${index}`); return
                }
                const previousBlock = cardTree.contents[index - 1]
                const newOrder = OctoUtils.getOrderBefore(previousBlock, cardTree.contents)
                Utils.log(`moveUp ${newOrder}`)
                mutator.changeOrder(block, newOrder, 'move up')
                break
            }
            case 'moveDown': {
                if (index >= cardTree.contents.length - 1) {
                    Utils.logError(`Unexpected index ${index}`); return
                }
                const nextBlock = cardTree.contents[index + 1]
                const newOrder = OctoUtils.getOrderAfter(nextBlock, cardTree.contents)
                Utils.log(`moveDown ${newOrder}`)
                mutator.changeOrder(block, newOrder, 'move down')
                break
            }
            case 'insertAbove-text': {
                const newBlock = new MutableTextBlock()
                newBlock.parentId = cardId

                // TODO: Handle need to reorder all blocks
                newBlock.order = OctoUtils.getOrderBefore(block, cardTree.contents)
                Utils.log(`insert block ${block.id}, order: ${block.order}`)
                mutator.insertBlock(newBlock, 'insert card text')
                break
            }
            case 'insertAbove-image': {
                Utils.selectLocalFile(
                    (file) => {
                        mutator.createImageBlock(cardId, file, OctoUtils.getOrderBefore(block, cardTree.contents))
                    },
                    '.jpg,.jpeg,.png')

                break
            }
            case 'delete': {
                mutator.deleteBlock(block)
                break
            }
            }
        }
        OldMenu.shared.showAtElement(e.target as HTMLElement)
    }

    public render(): JSX.Element {
        const {block} = this.props
        if (block.type !== 'text' && block.type !== 'image') {
            return null
        }
        return (
            <div className='octo-block octo-hover-container'>
                <div className='octo-block-margin'>
                    <div
                        className='octo-button octo-hovercontrol square octo-hover-item'
                        onClick={(e) => {
                            this.showContentBlockMenu(e)
                        }}
                    >
                        <div className='imageOptions'/>
                    </div>
                </div>
                {block.type === 'text' &&
                    <MarkdownEditor
                        text={block.title}
                        placeholderText='Edit text...'
                        onChanged={(text) => {
                            Utils.log(`change text ${block.id}, ${text}`)
                            mutator.changeTitle(block, text, 'edit card text')
                        }}
                    />}
                {block.type === 'image' &&
                    <img
                        src={block.fields.url}
                        alt={block.title}
                    />}
            </div>
        )
    }
}

export default ContentBlock
