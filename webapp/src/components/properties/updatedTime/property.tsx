import {IntlShape} from 'react-intl'
import UpdatedTime from './updatedTime'
import {Options} from '../../calculations/options'
import {IPropertyTemplate} from '../../../blocks/board'
import {Card} from '../../../blocks/card'
import {Utils} from '../../../utils'
import {PropertyType} from '../types'

const UpdatedTimeProperty: PropertyType = {
    Editor: UpdatedTime,
    Value: UpdatedTime,
    name: 'Last Modified At',
    type: 'updatedTime',
    displayName: (intl: IntlShape) => intl.formatMessage({id: 'PropertyType.UpdatedTime', defaultMessage: 'Last Modified at'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue, Options.earliest,
        Options.latest, Options.dateRange],
    displayValue: (_1: string | string[] | undefined, card: Card, _2: IPropertyTemplate, intl: IntlShape) => Utils.displayDateTime(new Date(card.updateAt), intl)
};

export default UpdatedTimeProperty;
