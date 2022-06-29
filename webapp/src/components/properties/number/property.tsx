import {IntlShape} from 'react-intl'
import Number from './number'
import {Options} from '../../calculations/options'

const NumberProperty = {
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
    displayValue: (block: Block, propertyValue: string | string[] | undefined, propertyTemplate: IPropertyTemplate, intl: IntlShape) => propertyValue,
};

export default NumberProperty;
