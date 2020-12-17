// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {IBlock} from '../blocks/block'
import {MutableDividerBlock} from '../blocks/dividerBlock'
import {IOrderedBlock} from '../blocks/orderedBlock'
import {MutableTextBlock} from '../blocks/textBlock'
import mutator from '../mutator'
import {OctoUtils} from '../octoUtils'
import {Utils} from '../utils'
import IconButton from '../widgets/buttons/iconButton'
import AddIcon from '../widgets/icons/add'
import DeleteIcon from '../widgets/icons/delete'
import DividerIcon from '../widgets/icons/divider'
import ImageIcon from '../widgets/icons/image'
import OptionsIcon from '../widgets/icons/options'
import SortDownIcon from '../widgets/icons/sortDown'
import SortUpIcon from '../widgets/icons/sortUp'
import TextIcon from '../widgets/icons/text'
import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'

import './contentBlock.scss'
import {MarkdownEditor} from './markdownEditor'

type Props = {
    block: IOrderedBlock
    card: IBlock
    contents: readonly IOrderedBlock[]
    readonly: boolean
}

class ContentBlock extends React.PureComponent<Props> {
    public render(): JSX.Element | null {
        const {card, contents, block} = this.props

        if (block.type !== 'text' && block.type !== 'image' && block.type !== 'divider') {
            Utils.assertFailure(`Block type is unknown: ${block.type}`)
            return null
        }

        const index = contents.indexOf(block)
        return (
            <div className='ContentBlock octo-block'>
                <div className='octo-block-margin'>
                    {!this.props.readonly &&
                        <MenuWrapper>
                            <IconButton icon={<OptionsIcon/>}/>
                            <Menu>
                                {index > 0 &&
                                    <Menu.Text
                                        id='moveUp'
                                        name='Move up'
                                        icon={<SortUpIcon/>}
                                        onClick={() => {
                                            const previousBlock = contents[index - 1]
                                            const newOrder = OctoUtils.getOrderBefore(previousBlock, contents)
                                            Utils.log(`moveUp ${newOrder}`)
                                            mutator.changeOrder(block, newOrder, 'move up')
                                        }}
                                    />}
                                {index < (contents.length - 1) &&
                                    <Menu.Text
                                        id='moveDown'
                                        name='Move down'
                                        icon={<SortDownIcon/>}
                                        onClick={() => {
                                            const nextBlock = contents[index + 1]
                                            const newOrder = OctoUtils.getOrderAfter(nextBlock, contents)
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
                                            newBlock.parentId = card.id
                                            newBlock.rootId = card.rootId

                                            // TODO: Handle need to reorder all blocks
                                            newBlock.order = OctoUtils.getOrderBefore(block, contents)
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
                                                    mutator.createImageBlock(card, file, OctoUtils.getOrderBefore(block, contents))
                                                },
                                                '.jpg,.jpeg,.png')
                                        }}
                                    />
                                    <Menu.Text
                                        id='divider'
                                        name='Divider'
                                        icon={<DividerIcon/>}
                                        onClick={() => {
                                            const newBlock = new MutableDividerBlock()
                                            newBlock.parentId = card.id
                                            newBlock.rootId = card.rootId

                                            // TODO: Handle need to reorder all blocks
                                            newBlock.order = OctoUtils.getOrderBefore(block, contents)
                                            Utils.log(`insert block ${block.id}, order: ${block.order}`)
                                            mutator.insertBlock(newBlock, 'insert card text')
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
                    }
                </div>
                {block.type === 'text' &&
                    <MarkdownEditor
                        text={block.title}
                        placeholderText='Edit text...'
                        onBlur={(text) => {
                            Utils.log(`change text ${block.id}, ${text}`)
                            mutator.changeTitle(block, text, 'edit card text')
                        }}
                        readonly={this.props.readonly}
                    />}
                {block.type === 'divider' && <div className='divider'/>}
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
