import {IntlShape} from 'react-intl'
import Checkbox from './checkbox'
import {Options} from '../calculations/options'
import {PropertyType} from '../types'

const CheckboxProperty: PropertyType = {
    Editor: Checkbox,
    Value: Checkbox,
    name: 'Checkbox',
    type: 'checkbox',
    displayName: (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Checkbox', defaultMessage: 'Checkbox'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue],
    displayValue: (propertyValue: string | string[] | undefined) => propertyValue,
};

export default CheckboxProperty;
