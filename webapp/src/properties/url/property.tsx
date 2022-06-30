import {IntlShape} from 'react-intl'
import Url from './url'
import {Options} from '../../components/calculations/options'
import {PropertyType} from '../types'

const UrlProperty: PropertyType = {
    Editor: Url,
    Value: Url,
    name: 'Url',
    type: 'url',
    displayName: (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Url', defaultMessage: 'Url'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue],
    displayValue: (propertyValue: string | string[] | undefined) => propertyValue,
};

export default UrlProperty;
