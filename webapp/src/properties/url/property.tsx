import {IntlShape} from 'react-intl'

import {PropertyType, PropertyTypeEnum, FilterValueType} from '../types'

import Url from './url'

export default class UrlProperty extends PropertyType {
    Editor = Url
    name = 'Url'
    type = 'url' as PropertyTypeEnum
    displayName = (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Url', defaultMessage: 'URL'})
    canFilter = true
    filterValueType = 'text' as FilterValueType
}
