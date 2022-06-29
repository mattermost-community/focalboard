import {IntlShape} from 'react-intl'
import Phone from './phone'
import {Options} from '../../calculations/options'

const PhoneProperty = {
    Editor: Phone,
    Value: Phone,
    name: 'Phone',
    type: 'phone',
    displayName: (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Phone', defaultMessage: 'Phone'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue],
    displayValue: (block: Block, propertyValue: string | string[] | undefined, propertyTemplate: IPropertyTemplate, intl: IntlShape) => propertyValue,
};

export default PhoneProperty;
