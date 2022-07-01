import {IntlShape} from 'react-intl'
import UpdatedBy from './updatedBy'
import {Options} from '../../components/calculations/options'
import {PropertyType} from '../types'
import {exportAsString} from '../propertyValueUtils'
import {defaultValueLength} from '../propertyValueUtils'

const UpdatedByProperty: PropertyType = {
    Editor: UpdatedBy,
    Value: UpdatedBy,
    name: 'Last Modified By',
    type: 'updatedBy',
    isReadOnly: true,
    displayName: (intl: IntlShape) => intl.formatMessage({id: 'PropertyType.UpdatedBy', defaultMessage: 'Last Modified by'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue],
    displayValue: (propertyValue: string | string[] | undefined) => propertyValue,
    exportValue: exportAsString,
    valueLength: defaultValueLength,
};

UpdatedByProperty.exportValue.bind(UpdatedByProperty)

export default UpdatedByProperty;
