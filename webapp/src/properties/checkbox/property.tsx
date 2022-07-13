import {IntlShape} from 'react-intl'

import {PropertyType, PropertyTypeEnum} from '../types'

import Checkbox from './checkbox'

export default class CheckboxProperty extends PropertyType {
    Editor = Checkbox
    name = 'Checkbox'
    type = 'checkbox' as PropertyTypeEnum
    displayName = (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Checkbox', defaultMessage: 'Checkbox'})
}
