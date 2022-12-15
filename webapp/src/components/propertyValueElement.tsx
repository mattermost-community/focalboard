// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {Board, IPropertyTemplate} from '../blocks/board'
import {Card} from '../blocks/card'
import {Page} from '../blocks/page'

import propsRegistry from '../properties'

type Props = {
    board: Board
    readOnly: boolean
    item: Card|Page
    propertyTemplate: IPropertyTemplate
    showEmptyPlaceholder: boolean
}

const PropertyValueElement = (props: Props): JSX.Element => {
    const {item, propertyTemplate, readOnly, showEmptyPlaceholder, board} = props

    let propertyValue = item.fields.properties[propertyTemplate.id]
    if (propertyValue === undefined) {
        propertyValue = ''
    }
    const property = propsRegistry.get(propertyTemplate.type)
    const Editor = property.Editor
    return (
        <Editor
            property={property}
            item={item}
            board={board}
            readOnly={readOnly}
            showEmptyPlaceholder={showEmptyPlaceholder}
            propertyTemplate={propertyTemplate}
            propertyValue={propertyValue}
        />
    )
}

export default PropertyValueElement
