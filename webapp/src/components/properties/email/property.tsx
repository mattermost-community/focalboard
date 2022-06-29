import {IntlShape} from 'react-intl'
import Email from './email'
import {Options} from '../../calculations/options'

const EmailProperty = {
    Editor: Email,
    Value: Email,
    name: 'Email',
    type: 'email',
    displayName: (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Email', defaultMessage: 'Email'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue],
    displayValue: (block: Block, propertyValue: string | string[] | undefined, propertyTemplate: IPropertyTemplate, intl: IntlShape) => propertyValue,
};

export default EmailProperty;
