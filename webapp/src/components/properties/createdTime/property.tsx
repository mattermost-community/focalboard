import {IntlShape} from 'react-intl'
import CreatedTime from './createdTime'
import {Options} from '../../calculations/options'

const CreatedAtProperty = {
    Editor: CreatedTime,
    Value: CreatedTime,
    name: 'Created At',
    type: 'createdTime',
    displayName: (intl: IntlShape) => intl.formatMessage({id: 'PropertyType.CreatedTime', defaultMessage: 'Created time'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue, Options.earliest,
        Options.latest, Options.dateRange],
    displayValue: (block: Block, propertyValue: string | string[] | undefined, propertyTemplate: IPropertyTemplate, intl: IntlShape) => propertyValue
};

export default CreatedAtProperty;
