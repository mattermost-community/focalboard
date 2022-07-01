import {IntlShape} from 'react-intl'
import Text from './text'
import {PropertyType, PropertyTypeEnum} from '../types'

export default class TextProperty extends PropertyType {
    Editor = Text
    name = 'Text'
    type = 'text' as PropertyTypeEnum
    displayName = (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Text', defaultMessage: 'Text'})
}
