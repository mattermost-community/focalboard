import {IntlShape} from 'react-intl'
import {DateUtils} from 'react-day-picker'

import {Options} from '../../components/calculations/options'
import {IPropertyTemplate} from '../../blocks/board'
import {Card} from '../../blocks/card'
import {Utils} from '../../utils'

import {PropertyType, PropertyTypeEnum} from '../types'

import DateComponent, {createDatePropertyFromString} from './date'

const oneDay = 60 * 60 * 24 * 1000

const timeZoneOffset = (date: number): number => {
    return new Date(date).getTimezoneOffset() * 60 * 1000
}

export default class DateProperty extends PropertyType {
    Editor = DateComponent
    name = 'Date'
    type = 'date' as PropertyTypeEnum
    isDate = true
    displayName = (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Date', defaultMessage: 'Date'})
    calculationOptions = [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue]
    displayValue = (propertyValue: string | string[] | undefined, _1: Card, _2: IPropertyTemplate, intl: IntlShape) => {
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

    getDateFrom = (value: string | string[] | undefined, card: Card) => {
        const dateProperty = createDatePropertyFromString(value as string)
        if (!dateProperty.from) {
            return new Date(card.createAt || 0)
        }
        // date properties are stored as 12 pm UTC, convert to 12 am (00) UTC for calendar
        const dateFrom = dateProperty.from ? new Date(dateProperty.from + (dateProperty.includeTime ? 0 : timeZoneOffset(dateProperty.from))) : new Date()
        dateFrom.setHours(0, 0, 0, 0)
        return dateFrom
    }

    getDateTo = (value: string | string[] | undefined, card: Card) => {
        const dateProperty = createDatePropertyFromString(value as string)
        if (!dateProperty.from) {
            return new Date(card.createAt || 0)
        }
        const dateFrom = dateProperty.from ? new Date(dateProperty.from + (dateProperty.includeTime ? 0 : timeZoneOffset(dateProperty.from))) : new Date()
        dateFrom.setHours(0, 0, 0, 0)

        const dateToNumber = dateProperty.to ? dateProperty.to + (dateProperty.includeTime ? 0 : timeZoneOffset(dateProperty.to)) : dateFrom.getTime()
        const dateTo = new Date(dateToNumber + oneDay) // Add one day.
        dateTo.setHours(0, 0, 0, 0)
        return dateTo
    }
}
