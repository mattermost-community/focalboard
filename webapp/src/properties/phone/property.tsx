import {IntlShape} from 'react-intl'
import Phone from './phone'
import {Options} from '../../components/calculations/options'
import {PropertyType} from '../types'
import {exportAsString} from '../propertyValueUtils'
import {defaultValueLength} from '../propertyValueUtils'

const PhoneProperty: PropertyType = {
    Editor: Phone,
    Value: Phone,
    name: 'Phone',
    type: 'phone',
    displayName: (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Phone', defaultMessage: 'Phone'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue],
    displayValue: (propertyValue: string | string[] | undefined) => propertyValue,
    exportValue: exportAsString,
    valueLength: defaultValueLength,
};

PhoneProperty.exportValue.bind(PhoneProperty)

export default PhoneProperty;
