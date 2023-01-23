// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IntlShape} from 'react-intl'

import {IPropertyTemplate} from '../../blocks/board'
import {Card} from '../../blocks/card'
import {Page} from '../../blocks/page'
import {Utils} from '../../utils'
import {PropertyType, PropertyTypeEnum, FilterValueType} from '../types'

import Select from './select'

export default class SelectProperty extends PropertyType {
    Editor = Select
    name = 'Select'
    type = 'select' as PropertyTypeEnum
    canGroup = true
    canFilter = true
    filterValueType = 'options' as FilterValueType

    displayName = (intl: IntlShape) => intl.formatMessage({id: 'PropertyType.Select', defaultMessage: 'Select'})

    displayValue = (propertyValue: string | string[] | undefined, item: Card|Page, propertyTemplate: IPropertyTemplate) => {
        if (propertyValue) {
            const option = propertyTemplate.options.find((o) => o.id === propertyValue)
            if (!option) {
                Utils.assertFailure(`Invalid select option ID ${propertyValue}, block.title: ${item.title}`)
            }
            return option?.value || '(Unknown)'
        }
        return ''
    }

    valueLength = (value: string | string[] | undefined, item: Card|Page, template: IPropertyTemplate, _: IntlShape, fontDescriptor: string): number => {
        const displayValue = this.displayValue(value, item, template) || ''
        return Utils.getTextWidth(displayValue.toString().toUpperCase(), fontDescriptor)
    }
}
