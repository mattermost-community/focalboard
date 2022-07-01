import {IntlShape} from 'react-intl'
import Text from './text'
import {Options} from '../../components/calculations/options'
import {PropertyType} from '../types'
import {exportAsString} from '../propertyValueUtils'
import {defaultValueLength} from '../propertyValueUtils'

const TextProperty: PropertyType = {
    Editor: Text,
    name: 'Text',
    type: 'text',
    displayName: (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Text', defaultMessage: 'Text'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue],
    displayValue: (propertyValue: string | string[] | undefined) => propertyValue,
    getValue: (propertyValue: string | string[] | undefined) => propertyValue,
    exportValue: exportAsString,
    valueLength: defaultValueLength,
};

TextProperty.exportValue.bind(TextProperty)

export default TextProperty;
