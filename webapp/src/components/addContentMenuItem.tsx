// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react'
import {useIntl} from 'react-intl'

import {BlockTypes} from '../blocks/block'
import {Utils} from '../utils'
import Menu from '../widgets/menu'

import {useCardDetailContext} from './cardDetail/cardDetailContext'
import {contentRegistry} from './content/contentRegistry'

type Props = {
    type: BlockTypes
    cords: {x: number, y?: number, z?: number}
}

const AddContentMenuItem = (props: Props): JSX.Element => {
    const {type, cords} = props
    const index = cords.x
    const intl = useIntl()
    const cardDetail = useCardDetailContext()

    const handler = contentRegistry.getHandler(type)
    if (!handler) {
        Utils.logError(`addContentMenu, unknown content type: ${type}`)
        return <></>
    }

    const addElement = useCallback(() => {
        cardDetail.addBlock(handler, index, false)
    }, [cardDetail, handler, index])

    return (
        <Menu.Text
            key={type}
            id={type}
            name={handler.getDisplayText(intl)}
            icon={handler.getIcon()}
            onClick={addElement}
        />
    )
}

export default React.memo(AddContentMenuItem)
