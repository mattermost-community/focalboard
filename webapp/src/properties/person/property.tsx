import {IntlShape} from 'react-intl'
import Person from './person'
import {Options} from '../../components/calculations/options'
import {PropertyType} from '../types'

const PersonProperty: PropertyType = {
    Editor: Person,
    Value: Person,
    name: 'Person',
    type: 'person',
    displayName: (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Person', defaultMessage: 'Person'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue],
    displayValue: (propertyValue: string | string[] | undefined) => propertyValue,
};

export default PersonProperty;
