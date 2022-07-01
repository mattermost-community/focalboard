import {IntlShape} from 'react-intl'
import MultiSelect from './multiselect'
import {IPropertyTemplate} from '../../blocks/board'
import {Card} from '../../blocks/card'
import {Utils} from '../../utils'
import {PropertyType, PropertyTypeEnum} from '../types'

export default class MultiSelectProperty extends PropertyType {
    Editor = MultiSelect
    name = 'MultiSelect'
    type = 'multiSelect' as PropertyTypeEnum
    canFilter = true
    displayName = (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.MultiSelect', defaultMessage: 'MultiSelect'})
    displayValue = (propertyValue: string | string[] | undefined, card: Card, propertyTemplate: IPropertyTemplate, _: IntlShape) => {
        if (propertyValue?.length) {
            const options = propertyTemplate.options.filter((o) => propertyValue.includes(o.id))
            if (!options.length) {
                Utils.assertFailure(`Invalid multiSelect option IDs ${propertyValue}, block.title: ${card.title}`)
            }
            return options.map((o) => o.value)
        }
        return ''
    }

    exportValue = (value: string | string[] | undefined, card: Card, template: IPropertyTemplate, intl: IntlShape): string => {
        const displayValue = this.displayValue(value, card, template, intl)
        return ((displayValue as unknown || []) as string[]).join('|')
    }

    valueLength = (value: string | string[] | undefined, card: Card, template: IPropertyTemplate, intl: IntlShape, fontDescriptor: string, perItemPadding: number): number => {
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
}
