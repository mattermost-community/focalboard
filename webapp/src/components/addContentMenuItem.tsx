// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {BlockTypes} from '../blocks/block'
import {Card} from '../blocks/card'
import {IContentBlock} from '../blocks/contentBlock'
import mutator from '../mutator'
import {Utils} from '../utils'
import Menu from '../widgets/menu'

import {contentRegistry} from './content/contentRegistry'

type Props = {
    type: BlockTypes
    block: IContentBlock
    intl: IntlShape,
    card: Card
    contents: readonly IContentBlock[]
}

const AddContentMenuItem = React.memo((props:Props): JSX.Element => {
    const {intl, card, contents, block, type} = props
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
                const newBlock = await handler.createBlock(card.rootId)
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
})

export default injectIntl(AddContentMenuItem)
