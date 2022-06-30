import {IntlShape} from 'react-intl'
import {DateUtils} from 'react-day-picker'
import DateComponent from './date'
import {Options} from '../../calculations/options'
import {IPropertyTemplate} from '../../../blocks/board'
import {Card} from '../../../blocks/card'
import {Utils} from '../../../utils'
import {PropertyType} from '../types'

const DateProperty: PropertyType = {
    Editor: DateComponent,
    Value: DateComponent,
    name: 'Date',
    type: 'date',
    displayName: (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Date', defaultMessage: 'Date'}),
    calculationOptions: [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue],
    displayValue: (propertyValue: string | string[] | undefined, _1: Card, _2: IPropertyTemplate, intl: IntlShape) => {
        let displayValue = ''
        if (propertyValue && typeof propertyValue === "string") {
            const singleDate = new Date(parseInt(propertyValue, 10))
            if (singleDate && DateUtils.isDate(singleDate)) {
                displayValue = Utils.displayDate(new Date(parseInt(propertyValue, 10)), intl)
            } else {
                try {
                    const dateValue = JSON.parse(propertyValue as string)
                    if (dateValue.from) {
                        displayValue = Utils.displayDate(new Date(dateValue.from), intl)
                    }
                    if (dateValue.to) {
                        displayValue += ' -> '
                        displayValue += Utils.displayDate(new Date(dateValue.to), intl)
                    }
                } catch {
                    // do nothing
                }
            }
        }
        return displayValue
    }
};

export default DateProperty;
