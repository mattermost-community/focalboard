import {IntlShape} from 'react-intl'
import Select from './select'
import {IPropertyTemplate} from '../../blocks/board'
import {Card} from '../../blocks/card'
import {Utils} from '../../utils'
import {PropertyType, PropertyTypeEnum} from '../types'

export default class SelectProperty extends PropertyType {
    Editor = Select
    name = 'Select'
    type = 'select' as PropertyTypeEnum
    canGroup = true
    canFilter = true

    displayName = (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Select', defaultMessage: 'Select'})

    displayValue = (propertyValue: string | string[] | undefined, card: Card, propertyTemplate: IPropertyTemplate, _: IntlShape) => {
        if (propertyValue) {
            const option = propertyTemplate.options.find((o) => o.id === propertyValue)
            if (!option) {
                Utils.assertFailure(`Invalid select option ID ${propertyValue}, block.title: ${card.title}`)
            }
            return option?.value || '(Unknown)'
        }
        return ''
    }

    valueLength = (value: string | string[] | undefined, card: Card, template: IPropertyTemplate, intl: IntlShape, fontDescriptor: string): number => {
        const displayValue = this.displayValue(value, card, template, intl) || ''
        return Utils.getTextWidth(displayValue.toString().toUpperCase(), fontDescriptor)
    }
}
