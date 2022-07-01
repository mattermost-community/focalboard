import {IntlShape} from 'react-intl'
import {Options} from '../../components/calculations/options'
import {PropertyType} from '../types'
import {exportAsString} from '../propertyValueUtils'
import Email from './email'
import {defaultValueLength} from '../propertyValueUtils'

const EmailProperty: PropertyType = {
    Editor: Email,
    name: 'Email',
    type: 'email',
    displayName: (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Email', defaultMessage: 'Email'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue],
    displayValue: (propertyValue: string | string[] | undefined) => propertyValue,
    exportValue: exportAsString,
    valueLength: defaultValueLength,
};

EmailProperty.exportValue.bind(EmailProperty)

export default EmailProperty;
