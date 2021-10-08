// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useCallback, useContext} from 'react'

import {ContentBlock} from '../../blocks/contentBlock'
import {Utils} from '../../utils'

import CardDetailContext from '../cardDetail/cardDetailContext'

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
    cords: {x: number, y?: number, z?: number}
}

export default function ContentElement(props: Props): JSX.Element|null {
    const {block, readonly, cords} = props
    const cardDetail = useContext(CardDetailContext)

    const handler = contentRegistry.getHandler(block.type)
    if (!handler) {
        Utils.logError(`ContentElement, unknown content type: ${block.type}`)
        return null
    }

    const addNewElement = useCallback(() => {
        const index = cords.x + 1
        cardDetail.addNewBlock(handler, index)
    }, [cardDetail, cords, handler])

    return handler.createComponent(block, readonly, addNewElement)
}
