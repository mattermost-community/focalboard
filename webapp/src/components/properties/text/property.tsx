import {IntlShape} from 'react-intl'
import Text from './text'
import {Options} from '../../calculations/options'
import {PropertyType} from '../types'

const TextProperty: PropertyType = {
    Editor: Text,
    Value: Text,
    name: 'Text',
    type: 'text',
    displayName: (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Text', defaultMessage: 'Text'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue],
    displayValue: (propertyValue: string | string[] | undefined) => propertyValue,
};

export default TextProperty;
