import {IntlShape} from 'react-intl'
import Number from './number'
import {Options} from '../../components/calculations/options'
import {PropertyType} from '../types'
import {exportAsNumber} from '../propertyValueUtils'
import {defaultValueLength} from '../propertyValueUtils'

const NumberProperty: PropertyType = {
    Editor: Number,
    name: 'Number',
    type: 'number',
    displayName: (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Number', defaultMessage: 'Number'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue, Options.sum,
        Options.average, Options.median, Options.min, Options.max,
        Options.range],
    displayValue: (propertyValue: string | string[] | undefined) => propertyValue,
    exportValue: exportAsNumber,
    valueLength: defaultValueLength,
};

NumberProperty.exportValue.bind(NumberProperty)

export default NumberProperty;
