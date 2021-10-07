// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useCallback} from 'react'
import {useIntl} from 'react-intl'

import {ContentBlock} from '../../blocks/contentBlock'
import {Utils} from '../../utils'
import mutator from '../../mutator'
import {Card} from '../../blocks/card'

import {contentRegistry} from './contentRegistry'

// Need to require here to prevent webpack from tree-shaking these away
// TODO: Update webpack to avoid this
import './textElement'
import './imageElement'
import './dividerElement'
import './checkboxElement'

type Props = {
    block: ContentBlock
    readonly: boolean
    card: Card
    cords: {x: number, y?: number, z?: number}
}

export default function ContentElement(props: Props): JSX.Element|null {
    const {block, readonly, card, cords} = props
    const intl = useIntl()

    const handler = contentRegistry.getHandler(block.type)
    if (!handler) {
        Utils.logError(`ContentElement, unknown content type: ${block.type}`)
        return null
    }

    const addNewElement = useCallback(async () => {
        const newBlock = await handler.createBlock(card.rootId)
        newBlock.parentId = card.id
        newBlock.rootId = card.rootId

        const index = cords.x
        const contentOrder = card.fields.contentOrder.slice()
        contentOrder.splice(index + 1, 0, newBlock.id)
        const typeName = handler.getDisplayText(intl)
        const description = intl.formatMessage({id: 'ContentBlock.addElement', defaultMessage: 'add {type}'}, {type: typeName})
        mutator.performAsUndoGroup(async () => {
            await mutator.insertBlock(newBlock, description)
            await mutator.changeCardContentOrder(card.id, card.fields.contentOrder, contentOrder, description)
        })
    }, [card, cords, handler])

    return handler.createComponent(block, readonly, addNewElement)
}
