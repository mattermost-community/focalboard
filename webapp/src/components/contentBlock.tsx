// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {Card} from '../blocks/card'
import {IContentBlock} from '../blocks/contentBlock'
import {MutableDividerBlock} from '../blocks/dividerBlock'
import {MutableTextBlock} from '../blocks/textBlock'
import mutator from '../mutator'
import octoClient from '../octoClient'
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
    block: IContentBlock
    card: Card
    contents: readonly IContentBlock[]
    readonly: boolean
    intl: IntlShape
}

type State = {
    imageDataUrl?: string
}

class ContentBlock extends React.PureComponent<Props, State> {
    state: State = {}

    componentDidMount(): void {
        if (this.props.block.type === 'image' && !this.state.imageDataUrl) {
            this.loadImage()
        }
    }

    private async loadImage() {
        const imageDataUrl = await octoClient.fetchImage(this.props.block.fields.url)
        this.setState({imageDataUrl})
    }

    public render(): JSX.Element | null {
        const {intl, card, contents, block} = this.props

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
                                        name={intl.formatMessage({id: 'ContentBlock.moveUp', defaultMessage: 'Move up'})}
                                        icon={<SortUpIcon/>}
                                        onClick={() => {
                                            const contentOrder = contents.map((o) => o.id)
                                            Utils.arrayMove(contentOrder, index, index - 1)
                                            mutator.changeCardContentOrder(card, contentOrder)
                                        }}
                                    />}
                                {index < (contents.length - 1) &&
                                    <Menu.Text
                                        id='moveDown'
                                        name={intl.formatMessage({id: 'ContentBlock.moveDown', defaultMessage: 'Move down'})}
                                        icon={<SortDownIcon/>}
                                        onClick={() => {
                                            const contentOrder = contents.map((o) => o.id)
                                            Utils.arrayMove(contentOrder, index, index + 1)
                                            mutator.changeCardContentOrder(card, contentOrder)
                                        }}
                                    />}
                                <Menu.SubMenu
                                    id='insertAbove'
                                    name={intl.formatMessage({id: 'ContentBlock.insertAbove', defaultMessage: 'Insert above'})}
                                    icon={<AddIcon/>}
                                >
                                    <Menu.Text
                                        id='text'
                                        name={intl.formatMessage({id: 'ContentBlock.Text', defaultMessage: 'Text'})}
                                        icon={<TextIcon/>}
                                        onClick={() => {
                                            const newBlock = new MutableTextBlock()
                                            newBlock.parentId = card.id
                                            newBlock.rootId = card.rootId

                                            const contentOrder = contents.map((o) => o.id)
                                            contentOrder.splice(index, 0, newBlock.id)
                                            mutator.performAsUndoGroup(async () => {
                                                const description = intl.formatMessage({id: 'ContentBlock.addText', defaultMessage: 'add text'})
                                                await mutator.insertBlock(newBlock, description)
                                                await mutator.changeCardContentOrder(card, contentOrder, description)
                                            })
                                        }}
                                    />
                                    <Menu.Text
                                        id='image'
                                        name='Image'
                                        icon={<ImageIcon/>}
                                        onClick={() => {
                                            Utils.selectLocalFile((file) => {
                                                mutator.performAsUndoGroup(async () => {
                                                    const description = intl.formatMessage({id: 'ContentBlock.addImage', defaultMessage: 'add image'})
                                                    const newBlock = await mutator.createImageBlock(card, file, description)
                                                    if (newBlock) {
                                                        const contentOrder = contents.map((o) => o.id)
                                                        contentOrder.splice(index, 0, newBlock.id)
                                                        await mutator.changeCardContentOrder(card, contentOrder, description)
                                                    }
                                                })
                                            },
                                            '.jpg,.jpeg,.png')
                                        }}
                                    />
                                    <Menu.Text
                                        id='divider'
                                        name={intl.formatMessage({id: 'ContentBlock.divider', defaultMessage: 'Divider'})}
                                        icon={<DividerIcon/>}
                                        onClick={() => {
                                            const newBlock = new MutableDividerBlock()
                                            newBlock.parentId = card.id
                                            newBlock.rootId = card.rootId

                                            const contentOrder = contents.map((o) => o.id)
                                            contentOrder.splice(index, 0, newBlock.id)
                                            mutator.performAsUndoGroup(async () => {
                                                const description = intl.formatMessage({id: 'ContentBlock.addDivider', defaultMessage: 'add divider'})
                                                await mutator.insertBlock(newBlock, description)
                                                await mutator.changeCardContentOrder(card, contentOrder, description)
                                            })
                                        }}
                                    />
                                </Menu.SubMenu>
                                <Menu.Text
                                    icon={<DeleteIcon/>}
                                    id='delete'
                                    name={intl.formatMessage({id: 'ContentBlock.Delete', defaultMessage: 'Delete'})}
                                    onClick={() => {
                                        const description = intl.formatMessage({id: 'ContentBlock.DeleteAction', defaultMessage: 'delete'})
                                        const contentOrder = contents.map((o) => o.id).filter((o) => o !== block.id)
                                        mutator.performAsUndoGroup(async () => {
                                            await mutator.deleteBlock(block, description)
                                            await mutator.changeCardContentOrder(card, contentOrder, description)
                                        })
                                    }}
                                />
                            </Menu>
                        </MenuWrapper>
                    }
                </div>
                {block.type === 'text' &&
                    <MarkdownEditor
                        text={block.title}
                        placeholderText={intl.formatMessage({id: 'ContentBlock.editText', defaultMessage: 'Edit text...'})}
                        onBlur={(text) => {
                            mutator.changeTitle(block, text, intl.formatMessage({id: 'ContentBlock.editCardText', defaultMessage: 'edit card text'}))
                        }}
                        readonly={this.props.readonly}
                    />}
                {block.type === 'divider' && <div className='divider'/>}
                {block.type === 'image' && this.state.imageDataUrl &&
                    <img
                        src={this.state.imageDataUrl}
                        alt={block.title}
                    />}
            </div>
        )
    }
}

export default injectIntl(ContentBlock)
