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
import SortUpIcon from '../widgets/icons/sortUp'
import SortDownIcon from '../widgets/icons/sortDown'
import DeleteIcon from '../widgets/icons/delete'
import AddIcon from '../widgets/icons/add'
import TextIcon from '../widgets/icons/text'
import ImageIcon from '../widgets/icons/image'

import {MarkdownEditor} from './markdownEditor'

import './contentBlock.scss'

type Props = {
    block: IOrderedBlock
    cardId: string
    cardTree: CardTree
}

class ContentBlock extends React.Component<Props> {
    shouldComponentUpdate(): boolean {
        return true
    }

    public render(): JSX.Element {
        const {cardId, cardTree, block} = this.props
        if (block.type !== 'text' && block.type !== 'image') {
            return null
        }
        const index = cardTree.contents.indexOf(block)
        return (
            <div className='ContentBlock octo-block'>
                <div className='octo-block-margin'>
                    <MenuWrapper>
                        <div className='octo-button octo-hovercontrol square '><OptionsIcon/></div>
                        <Menu>
                            {index > 0 &&
                                <Menu.Text
                                    id='moveUp'
                                    name='Move up'
                                    icon={<SortUpIcon/>}
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
                                    icon={<SortDownIcon/>}
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
                                icon={<AddIcon/>}
                            >
                                <Menu.Text
                                    id='text'
                                    name='Text'
                                    icon={<TextIcon/>}
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
                                    icon={<ImageIcon/>}
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
                                icon={<DeleteIcon/>}
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
                        onBlur={(text) => {
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
