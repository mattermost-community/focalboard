// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {IOrderedBlock} from '../blocks/orderedBlock'
import {CardTree} from '../viewModel/cardTree'
import {OctoUtils} from '../octoUtils'
import mutator from '../mutator'
import {Utils} from '../utils'
import {MutableTextBlock} from '../blocks/textBlock'

import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'
import OptionsIcon from '../widgets/icons/options'

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

    public render(): JSX.Element {
        const {cardId, cardTree, block} = this.props
        if (block.type !== 'text' && block.type !== 'image') {
            return null
        }
        const index = cardTree.contents.indexOf(block)
        return (
            <div className='octo-block octo-hover-container'>
                <div className='octo-block-margin'>
                    <MenuWrapper>
                        <div className='octo-button octo-hovercontrol square octo-hover-item'><OptionsIcon/></div>
                        <Menu>
                            {index > 0 &&
                                <Menu.Text
                                    id='moveUp'
                                    name='Move up'
                                    onClick={() => {
                                        const previousBlock = cardTree.contents[index - 1]
                                        const newOrder = OctoUtils.getOrderBefore(previousBlock, cardTree.contents)
                                        Utils.log(`moveUp ${newOrder}`)
                                        mutator.changeOrder(block, newOrder, 'move up')
                                    }}
                                />}
                            {index < (cardTree.contents.length - 1) &&
                                <Menu.Text
                                    id='moveDown'
                                    name='Move down'
                                    onClick={() => {
                                        const nextBlock = cardTree.contents[index + 1]
                                        const newOrder = OctoUtils.getOrderAfter(nextBlock, cardTree.contents)
                                        Utils.log(`moveDown ${newOrder}`)
                                        mutator.changeOrder(block, newOrder, 'move down')
                                    }}
                                />}
                            <Menu.SubMenu
                                id='insertAbove'
                                name='Insert above'
                            >
                                <Menu.Text
                                    id='text'
                                    name='Text'
                                    onClick={() => {
                                        const newBlock = new MutableTextBlock()
                                        newBlock.parentId = cardId

                                        // TODO: Handle need to reorder all blocks
                                        newBlock.order = OctoUtils.getOrderBefore(block, cardTree.contents)
                                        Utils.log(`insert block ${block.id}, order: ${block.order}`)
                                        mutator.insertBlock(newBlock, 'insert card text')
                                    }}
                                />
                                <Menu.Text
                                    id='image'
                                    name='Image'
                                    onClick={() => {
                                        Utils.selectLocalFile(
                                            (file) => {
                                                mutator.createImageBlock(cardId, file, OctoUtils.getOrderBefore(block, cardTree.contents))
                                            },
                                            '.jpg,.jpeg,.png')
                                    }}
                                />
                            </Menu.SubMenu>
                            <Menu.Text
                                id='delete'
                                name='Delete'
                                onClick={() => mutator.deleteBlock(block)}
                            />
                        </Menu>
                    </MenuWrapper>
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
