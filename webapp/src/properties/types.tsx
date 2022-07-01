import React from 'react'
import {IntlShape} from 'react-intl'

import {Card} from '../blocks/card'
import {Board, IPropertyTemplate, PropertyTypeEnum} from '../blocks/board'
import {Options} from '../components/calculations/options'
import {exportAsString, defaultValueLength} from './propertyValueUtils'

export type {PropertyTypeEnum} from '../blocks/board'

export type PropertyProps = {
    card: Card,
    board: Board,
    readOnly: boolean,
    propertyValue: string | string[],
    propertyTemplate: IPropertyTemplate,
    showEmptyPlaceholder: boolean,
}

export abstract class PropertyType {
    isDate: boolean = false
    canGroup: boolean = false
    canFilter: boolean = false
    isReadOnly: boolean = false
    calculationOptions = [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue]
    displayValue: (value: string | string[] | undefined, card: Card, template: IPropertyTemplate, intl: IntlShape) => string | string[] | undefined
    exportValue: (value: string | string[] | undefined, card: Card, template: IPropertyTemplate, intl: IntlShape) => string
    valueLength: (value: string | string[] | undefined, card: Card, template: IPropertyTemplate, intl: IntlShape, fontDescriptor: string, perItemPadding: number) => number
    getDateFrom: (value: string | string[] | undefined, card: Card) => Date
    getDateTo: (value: string | string[] | undefined, card: Card) => Date

    constructor() {
        this.displayValue = (value: string | string[] | undefined) => value
        this.displayValue = (value: string | string[] | undefined) => value
        this.exportValue = exportAsString
        this.valueLength = defaultValueLength
        this.getDateFrom = (_: string | string[] | undefined, card: Card) => new Date(card.createAt || 0)
        this.getDateTo = (_: string | string[] | undefined, card: Card) => new Date(card.createAt || 0)
    }

    abstract Editor: React.FunctionComponent<PropertyProps>
    abstract name: string
    abstract type: PropertyTypeEnum
    abstract displayName: (intl: IntlShape) => string
}
