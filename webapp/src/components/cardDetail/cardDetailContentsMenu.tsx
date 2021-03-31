// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import {BlockTypes} from '../../blocks/block'
import mutator from '../../mutator'
import {Utils} from '../../utils'
import {Card} from '../../blocks/card'
import Button from '../../widgets/buttons/button'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'

import {ContentHandler, contentRegistry} from '../content/contentRegistry'

function addContentMenu(card: Card, intl: IntlShape, type: BlockTypes): JSX.Element {
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
            onClick={() => {
                addBlock(card, intl, handler)
            }}
        />
    )
}

async function addBlock(card: Card, intl: IntlShape, handler: ContentHandler) {
    const newBlock = await handler.createBlock(card.rootId)
    newBlock.parentId = card.id
    newBlock.rootId = card.rootId

    const contentOrder = card.contentOrder.slice()
    contentOrder.push(newBlock.id)
    const typeName = handler.getDisplayText(intl)
    const description = intl.formatMessage({id: 'ContentBlock.addElement', defaultMessage: 'add {type}'}, {type: typeName})
    mutator.performAsUndoGroup(async () => {
        await mutator.insertBlock(newBlock, description)
        await mutator.changeCardContentOrder(card, contentOrder, description)
    })
}

type Props = {
    card: Card
    intl: IntlShape
}

const CardDetailContentsMenu = React.memo((props: Props) => {
    return (
        <div className='CardDetail content add-content'>
            <MenuWrapper>
                <Button>
                    <FormattedMessage
                        id='CardDetail.add-content'
                        defaultMessage='Add content'
                    />
                </Button>
                <Menu position='top'>
                    {contentRegistry.contentTypes.map((type) => addContentMenu(props.card, props.intl, type))}
                </Menu>
            </MenuWrapper>
        </div>
    )
})

export default injectIntl(CardDetailContentsMenu)
