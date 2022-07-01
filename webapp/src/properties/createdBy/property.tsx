import {IntlShape} from 'react-intl'
import CreatedBy from './createdBy'
import {Options} from '../../components/calculations/options'
import {PropertyType} from '../types'
import {exportAsString} from '../propertyValueUtils'
import {defaultValueLength} from '../propertyValueUtils'

const CreatedByProperty: PropertyType = {
    Editor: CreatedBy,
    Value: CreatedBy,
    name: 'Created By',
    type: 'createdBy',
    isReadOnly: true,
    displayName: (intl: IntlShape) => intl.formatMessage({id: 'PropertyType.CreatedBy', defaultMessage: 'Created by'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue],
    displayValue: (propertyValue: string | string[] | undefined) => propertyValue,
    exportValue: exportAsString,
    valueLength: defaultValueLength,
};

CreatedByProperty.exportValue.bind(CreatedByProperty)

export default CreatedByProperty;
