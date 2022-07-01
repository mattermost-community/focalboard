import {IntlShape} from 'react-intl'
import Select from './select'
import {IPropertyTemplate} from '../../blocks/board'
import {Card} from '../../blocks/card'
import {Utils} from '../../utils'
import {PropertyType, PropertyTypeEnum} from '../types'
import {selectValueLength} from '../propertyValueUtils'

export default class SelectProperty extends PropertyType {
    Editor = Select
    name = 'Select'
    type = 'select' as PropertyTypeEnum
    canGroup = true
    canFilter = true
    displayName = (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Select', defaultMessage: 'Select'})
    displayValue = (propertyValue: string | string[] | undefined, card: Card, propertyTemplate: IPropertyTemplate) => {
        if (propertyValue) {
            const option = propertyTemplate.options.find((o) => o.id === propertyValue)
            if (!option) {
                Utils.assertFailure(`Invalid select option ID ${propertyValue}, block.title: ${card.title}`)
            }
            return option?.value || '(Unknown)'
        }
        return ''
    }
    valueLength = selectValueLength
}
