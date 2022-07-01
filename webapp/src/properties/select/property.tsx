import {IntlShape} from 'react-intl'
import Select from './select'
import {Options} from '../../components/calculations/options'
import {IPropertyTemplate} from '../../blocks/board'
import {Card} from '../../blocks/card'
import {Utils} from '../../utils'
import {PropertyType} from '../types'
import {exportAsString} from '../propertyValueUtils'
import {selectValueLength} from '../propertyValueUtils'

const SelectProperty: PropertyType = {
    Editor: Select,
    Value: Select,
    name: 'Select',
    type: 'select',
    canGroup: true,
    canFilter: true,
    displayName: (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Select', defaultMessage: 'Select'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue],
    displayValue: (propertyValue: string | string[] | undefined, card: Card, propertyTemplate: IPropertyTemplate) => {
        if (propertyValue) {
            const option = propertyTemplate.options.find((o) => o.id === propertyValue)
            if (!option) {
                Utils.assertFailure(`Invalid select option ID ${propertyValue}, block.title: ${card.title}`)
            }
            return option?.value || '(Unknown)'
        }
        return ''
    },
    exportValue: exportAsString,
    valueLength: selectValueLength,
};

SelectProperty.exportValue.bind(SelectProperty)

export default SelectProperty;
