// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {IntlShape} from 'react-intl'

import {IPropertyTemplate} from '../blocks/board'
import {Card} from '../blocks/card'

import {Utils} from '../utils'
import {PropertyType} from './types'

export function propertyValueClassName(options: { readonly?: boolean } = {}): string {
    return `octo-propertyvalue${options.readonly ? ' octo-propertyvalue--readonly' : ''}`
}

const hashSignToken = '___hash_sign___'
function encodeText(text: string): string {
    return text.replace(/"/g, '""').replace(/#/g, hashSignToken)
}

export function exportAsNumber(value: string | string[] | undefined): string {
    return value ? Number(value).toString() : ''
}

export function exportAsMultiSelect(this: PropertyType, value: string | string[] | undefined, card: Card, template: IPropertyTemplate, intl: IntlShape): string {
    const displayValue = this.displayValue(value, card, template, intl)
    return ((displayValue as unknown || []) as string[]).join('|')
}

export function exportAsString(this: PropertyType, value: string | string[] | undefined, card: Card, template: IPropertyTemplate, intl: IntlShape): string {
    const displayValue = this.displayValue(value, card, template, intl)
    return `"${encodeText(displayValue as string)}"`
}

export function selectValueLength(this: PropertyType, value: string | string[] | undefined, card: Card, template: IPropertyTemplate, intl: IntlShape, fontDescriptor: string, perItemPadding: number): number {
    const displayValue = this.displayValue(value, card, template, intl) || ''
    return Utils.getTextWidth(displayValue.toString().toUpperCase(), fontDescriptor)
}

export function multiSelectValueLength(this: PropertyType, value: string | string[] | undefined, card: Card, template: IPropertyTemplate, intl: IntlShape, fontDescriptor: string, perItemPadding: number): number {
    const displayValue = this.displayValue(value, card, template, intl)
    if (!displayValue) {
        return 0
    }
    const displayValues = displayValue as string[]
    let result = 0
    displayValues.forEach((value) => {
        result += Utils.getTextWidth(value.toUpperCase(), fontDescriptor) + perItemPadding
    })
    return result
}

export function defaultValueLength(this: PropertyType, value: string | string[] | undefined, card: Card, template: IPropertyTemplate, intl: IntlShape, fontDescriptor: string, perItemPadding: number): number {
    const displayValue = this.displayValue(value, card, template, intl) || ''
    return Utils.getTextWidth(displayValue.toString(), fontDescriptor)
}
