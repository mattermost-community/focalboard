import {IntlShape} from 'react-intl'
import Text from './text'
import {Options} from '../../calculations/options'

const TextProperty = {
    Editor: Text,
    Value: Text,
    name: 'Text',
    type: 'text',
    displayName: (intl:IntlShap) => intl.formatMessage({id: 'PropertyType.Text', defaultMessage: 'Text'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue],
    displayValue: (block: Block, propertyValue: string | string[] | undefined, propertyTemplate: IPropertyTemplate, intl: IntlShape) => propertyValue,
};

export default TextProperty;
