import {IntlShape} from 'react-intl'
import Checkbox from './checkbox'
import {Options} from '../../components/calculations/options'
import {PropertyType} from '../types'
import {exportAsString} from '../propertyValueUtils'
import {defaultValueLength} from '../propertyValueUtils'

const CheckboxProperty: PropertyType = {
    Editor: Checkbox,
    Value: Checkbox,
    name: 'Checkbox',
    type: 'checkbox',
    displayName: (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Checkbox', defaultMessage: 'Checkbox'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue],
    displayValue: (propertyValue: string | string[] | undefined) => propertyValue,
    exportValue: exportAsString,
    valueLength: defaultValueLength,
};

CheckboxProperty.exportValue.bind(CheckboxProperty)

export default CheckboxProperty
