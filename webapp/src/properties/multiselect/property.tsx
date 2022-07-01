import {IntlShape} from 'react-intl'
import MultiSelect from './multiselect'
import {IPropertyTemplate} from '../../blocks/board'
import {Card} from '../../blocks/card'
import {Utils} from '../../utils'
import {PropertyType, PropertyTypeEnum} from '../types'
import {exportAsMultiSelect} from '../propertyValueUtils'
import {multiSelectValueLength} from '../propertyValueUtils'

export default class MultiSelectProperty extends PropertyType {
    Editor = MultiSelect
    name = 'MultiSelect'
    type = 'multiSelect' as PropertyTypeEnum
    canFilter = true
    displayName = (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.MultiSelect', defaultMessage: 'MultiSelect'})
    displayValue = (propertyValue: string | string[] | undefined, card: Card, propertyTemplate: IPropertyTemplate) => {
        if (propertyValue?.length) {
            const options = propertyTemplate.options.filter((o) => propertyValue.includes(o.id))
            if (!options.length) {
                Utils.assertFailure(`Invalid multiSelect option IDs ${propertyValue}, block.title: ${card.title}`)
            }
            return options.map((o) => o.value)
        }
        return ''
    }
    exportValue = exportAsMultiSelect
    valueLength = multiSelectValueLength
}
