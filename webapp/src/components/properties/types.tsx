import React from 'react'
import {IntlShape} from 'react-intl'

import {Card} from '../../blocks/card'
import {Board, IPropertyTemplate, PropertyTypeEnum} from '../../blocks/board'
import {Option} from '../calculations/options'

export type PropertyProps = {
    card: Card,
    board: Board,
    readOnly: boolean,
    propertyValue: string | string[],
    propertyTemplate: IPropertyTemplate,
    showEmptyPlaceholder: boolean,
}

export type PropertyType = {
    Editor: React.FunctionComponent<PropertyProps>,
    Value: React.FunctionComponent<PropertyProps>,
    name: string,
    type: PropertyTypeEnum,
    calculationOptions: Option[],
    displayName: (intl: IntlShape) => string,
    displayValue: (value: string | string[] | undefined, card: Card, template: IPropertyTemplate, intl: IntlShape) => string | string[] | undefined,
}

