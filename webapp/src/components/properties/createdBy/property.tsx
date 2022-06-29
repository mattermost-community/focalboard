import {IntlShape} from 'react-intl'
import CreatedBy from './createdBy'
import {Options} from '../../calculations/options'

const CreatedByProperty = {
    Editor: CreatedBy,
    Value: CreatedBy,
    name: 'Created By',
    type: 'createdBy',
    displayName: (intl: IntlShape) => intl.formatMessage({id: 'PropertyType.CreatedBy', defaultMessage: 'Created by'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue],
    displayValue: (block: Block, propertyValue: string | string[] | undefined, propertyTemplate: IPropertyTemplate, intl: IntlShape) => propertyValue
};

export default CreatedByProperty;
