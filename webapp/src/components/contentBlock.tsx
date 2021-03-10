// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {BlockTypes} from '../blocks/block'
import {Card} from '../blocks/card'
import {IContentBlock} from '../blocks/contentBlock'
import mutator from '../mutator'
import {Utils} from '../utils'
import IconButton from '../widgets/buttons/iconButton'
import AddIcon from '../widgets/icons/add'
import DeleteIcon from '../widgets/icons/delete'
import OptionsIcon from '../widgets/icons/options'
import SortDownIcon from '../widgets/icons/sortDown'
import SortUpIcon from '../widgets/icons/sortUp'
import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'

import ContentElement from './content/contentElement'
import {contentRegistry} from './content/contentRegistry'
import './contentBlock.scss'

type Props = {
    block: IContentBlock
    card: Card
    contents: readonly IContentBlock[]
    readonly: boolean
    intl: IntlShape
}

class ContentBlock extends React.PureComponent<Props> {
    public render(): JSX.Element | null {
        const {intl, card, contents, block, readonly} = this.props

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
                                    {contentRegistry.contentTypes.map((type) => this.addContentMenu(type))}
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
                <ContentElement
                    block={block}
                    readonly={readonly}
                />
            </div>
        )
    }

    private addContentMenu(type: BlockTypes): JSX.Element {
        const {intl, card, contents, block} = this.props
        const index = contents.indexOf(block)

        const handler = contentRegistry.getHandler(type)
        if (!handler) {
            Utils.logError(`addContentMenu, unknown content type: ${type}`)
            return <></>
        }

        return (
            <Menu.Text
                key={type}
                id={type}
                name={handler.getDisplayText(intl)}
                icon={handler.getIcon()}
                onClick={async () => {
                    const newBlock = await handler.createBlock()
                    newBlock.parentId = card.id
                    newBlock.rootId = card.rootId

                    const contentOrder = contents.map((o) => o.id)
                    contentOrder.splice(index, 0, newBlock.id)
                    const typeName = handler.getDisplayText(intl)
                    const description = intl.formatMessage({id: 'ContentBlock.addElement', defaultMessage: 'add {type}'}, {type: typeName})
                    mutator.performAsUndoGroup(async () => {
                        await mutator.insertBlock(newBlock, description)
                        await mutator.changeCardContentOrder(card, contentOrder, description)
                    })
                }}
            />
        )
    }
}

export default injectIntl(ContentBlock)
