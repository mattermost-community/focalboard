// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

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
import GripIcon from '../widgets/icons/grip'
import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'
import {useSortableWithGrip} from '../hooks/sortable'

import ContentElement from './content/contentElement'
import AddContentMenuItem from './addContentMenuItem'
import {contentRegistry} from './content/contentRegistry'
import './contentBlock.scss'

type Props = {
    block: IContentBlock
    card: Card
    contents: readonly IContentBlock[]
    readonly: boolean
    intl: IntlShape
    onDrop: (srctBlock: IContentBlock, dstBlock: IContentBlock) => void
}

const ContentBlock = React.memo((props: Props): JSX.Element => {
    const {intl, card, contents, block, readonly} = props
    const [isDragging, isOver, gripRef, itemRef] = useSortableWithGrip('content', block, true, props.onDrop)

    const index = contents.indexOf(block)
    let className = 'ContentBlock octo-block'
    if (isOver) {
        className += ' dragover'
    }
    return (
        <div
            className={className}
            style={{opacity: isDragging ? 0.5 : 1}}
            ref={itemRef}
        >
            <div className='octo-block-margin'>
                {!props.readonly &&
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
                                {contentRegistry.contentTypes.map((type) => (
                                    <AddContentMenuItem
                                        key={type}
                                        type={type}
                                        block={block}
                                        card={card}
                                        contents={contents}
                                    />
                                ))}
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
                <div
                    ref={gripRef}
                    className='dnd-handle'
                >
                    <GripIcon/>
                </div>
            </div>
            <ContentElement
                block={block}
                readonly={readonly}
            />
        </div>
    )
})

export default injectIntl(ContentBlock)
