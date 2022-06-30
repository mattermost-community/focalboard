import {IntlShape} from 'react-intl'
import {Options} from '../../components/calculations/options'
import {PropertyType} from '../types'
import Email from './email'

const EmailProperty: PropertyType = {
    Editor: Email,
    Value: Email,
    name: 'Email',
    type: 'email',
    displayName: (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Email', defaultMessage: 'Email'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue],
    displayValue: (propertyValue: string | string[] | undefined) => propertyValue,
};

export default EmailProperty;
