import {IntlShape} from 'react-intl'
import Number from './number'
import {Options} from '../../calculations/options'
import {PropertyType} from '../types'

const NumberProperty: PropertyType = {
    Editor: Number,
    Value: Number,
    name: 'Number',
    type: 'number',
    displayName: (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Number', defaultMessage: 'Number'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue, Options.sum,
        Options.average, Options.median, Options.min, Options.max,
        Options.range],
    displayValue: (propertyValue: string | string[] | undefined) => propertyValue,
};

export default NumberProperty;
