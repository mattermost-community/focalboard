import {IntlShape} from 'react-intl'
import Phone from './phone'
import {PropertyType, PropertyTypeEnum} from '../types'

export default class PhoneProperty extends PropertyType {
    Editor = Phone
    name = 'Phone'
    type = 'phone' as PropertyTypeEnum
    displayName = (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Phone', defaultMessage: 'Phone'})
}
