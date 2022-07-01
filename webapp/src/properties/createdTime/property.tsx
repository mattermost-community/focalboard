import {IntlShape} from 'react-intl'
import CreatedTime from './createdTime'
import {Options} from '../../components/calculations/options'
import {IPropertyTemplate} from '../../blocks/board'
import {Card} from '../../blocks/card'
import {Utils} from '../../utils'
import {PropertyType} from '../types'
import {exportAsString} from '../propertyValueUtils'
import {defaultValueLength} from '../propertyValueUtils'

const CreatedAtProperty: PropertyType = {
    Editor: CreatedTime,
    Value: CreatedTime,
    name: 'Created At',
    type: 'createdTime',
    isDate: true,
    isReadOnly: true,
    displayName: (intl: IntlShape) => intl.formatMessage({id: 'PropertyType.CreatedTime', defaultMessage: 'Created time'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue, Options.earliest,
        Options.latest, Options.dateRange],
    displayValue: (_1: string | string[] | undefined, card: Card, _2: IPropertyTemplate, intl: IntlShape) => Utils.displayDateTime(new Date(card.createAt), intl),
    exportValue: exportAsString,
    valueLength: defaultValueLength,
    getDateFrom: (value: string | string[] | undefined, card: Card) => new Date(card.createAt || 0),
    getDateTo: (value: string | string[] | undefined, card: Card) => new Date(card.createAt || 0),
};

CreatedAtProperty.exportValue.bind(CreatedAtProperty)

export default CreatedAtProperty;
