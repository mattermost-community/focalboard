import React from 'react'
import {IntlShape} from 'react-intl'

import {Card} from '../blocks/card'
import {Board, IPropertyTemplate, PropertyTypeEnum} from '../blocks/board'
import {Option} from '../components/calculations/options'

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
    name: string,
    type: PropertyTypeEnum,
    isDate?: boolean,
    canGroup?: boolean,
    canFilter?: boolean,
    isReadOnly?: boolean,
    calculationOptions: Option[],
    displayName: (intl: IntlShape) => string,
    displayValue: (value: string | string[] | undefined, card: Card, template: IPropertyTemplate, intl: IntlShape) => string | string[] | undefined,
    exportValue: (value: string | string[] | undefined, card: Card, template: IPropertyTemplate, intl: IntlShape) => string,
    valueLength: (value: string | string[] | undefined, card: Card, template: IPropertyTemplate, intl: IntlShape, fontDescriptor: string, perItemPadding: number) => number,
    getDateFrom?: (value: string | string[] | undefined, card: Card) => Date,
    getDateTo?: (value: string | string[] | undefined, card: Card) => Date,
}
