import {IntlShape} from 'react-intl'
import MultiSelect from './multiselect'
import {Options} from '../../calculations/options'
import {IPropertyTemplate} from '../../../blocks/board'
import {Card} from '../../../blocks/card'
import {Utils} from '../../../utils'
import {PropertyType} from '../types'

const MultiSelectProperty: PropertyType = {
    Editor: MultiSelect,
    Value: MultiSelect,
    name: 'MultiSelect',
    type: 'multiSelect',
    displayName: (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.MultiSelect', defaultMessage: 'MultiSelect'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue],
    displayValue: (propertyValue: string | string[] | undefined, card: Card, propertyTemplate: IPropertyTemplate) => {
        if (propertyValue?.length) {
            const options = propertyTemplate.options.filter((o) => propertyValue.includes(o.id))
            if (!options.length) {
                Utils.assertFailure(`Invalid multiSelect option IDs ${propertyValue}, block.title: ${card.title}`)
            }
            return options.map((o) => o.value)
        }
        return ''
    }
};

export default MultiSelectProperty;
