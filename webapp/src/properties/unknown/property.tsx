import {IntlShape} from 'react-intl'
import Text from '../text/text'
import {Options} from '../../components/calculations/options'
import {PropertyType} from '../types'
import {exportAsString} from '../propertyValueUtils'
import {defaultValueLength} from '../propertyValueUtils'

const UnkownProperty: PropertyType = {
    Editor: Text,
    name: 'Text',
    type: 'unknown',
    displayName: (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Unknown', defaultMessage: 'Unknown'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue],
    displayValue: (propertyValue: string | string[] | undefined) => propertyValue,
    exportValue: exportAsString,
    valueLength: defaultValueLength,
};

UnkownProperty.exportValue.bind(UnkownProperty)

export default UnkownProperty;
