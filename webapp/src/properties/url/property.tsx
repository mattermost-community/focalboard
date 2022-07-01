import {IntlShape} from 'react-intl'
import Url from './url'
import {PropertyType, PropertyTypeEnum} from '../types'

export default class UrlProperty extends PropertyType {
    Editor = Url
    name = 'Url'
    type = 'url' as PropertyTypeEnum
    displayName = (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Url', defaultMessage: 'Url'})
}
