import {IntlShape} from 'react-intl'
import Text from '../text/text'
import {Options} from '../../components/calculations/options'
import {PropertyType} from '../types'

const UnkownProperty: PropertyType = {
    Editor: Text,
    Value: Text,
    name: 'Text',
    type: 'unknown',
    displayName: (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Unknown', defaultMessage: 'Unknown'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue],
    displayValue: (propertyValue: string | string[] | undefined) => propertyValue,
};

export default UnkownProperty;
