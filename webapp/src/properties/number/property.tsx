import {IntlShape} from 'react-intl'
import Number from './number'
import {Options} from '../../components/calculations/options'
import {PropertyType, PropertyTypeEnum} from '../types'
import {exportAsNumber} from '../propertyValueUtils'

export default class NumberProperty extends PropertyType {
    Editor = Number
    name = 'Number'
    type = 'number' as PropertyTypeEnum
    displayName = (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Number', defaultMessage: 'Number'})
    calculationOptions = [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue, Options.sum,
        Options.average, Options.median, Options.min, Options.max,
        Options.range]
    exportValue = exportAsNumber
}
