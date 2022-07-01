// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {useIntl} from 'react-intl'

import {Board, IPropertyTemplate} from '../blocks/board'
import {Card} from '../blocks/card'
import {propertyValueClassName} from '../properties/propertyValueUtils'

import propsRegistry from '../properties'

type Props = {
    board: Board
    readOnly: boolean
    card: Card
    propertyTemplate: IPropertyTemplate
    showEmptyPlaceholder: boolean
}

const PropertyValueElement = (props:Props): JSX.Element => {
    const {card, propertyTemplate, readOnly, showEmptyPlaceholder, board} = props

    const intl = useIntl()
    const propertyValue = card.fields.properties[propertyTemplate.id]

    const property = propsRegistry.get(propertyTemplate.type)
    if (property) {
        const Editor = property.Editor
        return (
            <Editor
                card={card}
                board={board}
                readOnly={readOnly}
                showEmptyPlaceholder={showEmptyPlaceholder}
                propertyTemplate={propertyTemplate}
                propertyValue={propertyValue}
            />
        )
    }
    const emptyDisplayValue = showEmptyPlaceholder ? intl.formatMessage({id: 'PropertyValueElement.empty', defaultMessage: 'Empty'}) : ''
    const displayValue = propertyValue || emptyDisplayValue
    return <div className={propertyValueClassName()}>{displayValue}</div>
}

export default PropertyValueElement
