import {IntlShape} from 'react-intl'
import CreatedBy from './createdBy'
import {Options} from '../components/calculations/options'
import {PropertyType} from '../types'

const CreatedByProperty: PropertyType = {
    Editor: CreatedBy,
    Value: CreatedBy,
    name: 'Created By',
    type: 'createdBy',
    displayName: (intl: IntlShape) => intl.formatMessage({id: 'PropertyType.CreatedBy', defaultMessage: 'Created by'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue],
    displayValue: (propertyValue: string | string[] | undefined) => propertyValue
};

export default CreatedByProperty;
