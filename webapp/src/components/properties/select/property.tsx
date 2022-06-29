import {IntlShape} from 'react-intl'
import Select from './select'
import {Options} from '../../calculations/options'

const SelectProperty = {
    Editor: Select,
    Value: Select,
    name: 'Select',
    type: 'select',
    displayName: (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Select', defaultMessage: 'Select'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue],
    displayValue: (block: Block, propertyValue: string | string[] | undefined, propertyTemplate: IPropertyTemplate, intl: IntlShape) => propertyValue,
};

export default SelectProperty;
