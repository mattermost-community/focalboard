import {IntlShape} from 'react-intl'

import {PropertyType, PropertyTypeEnum} from '../types'

import MultiPerson from './multiperson'

export default class MultiPersonProperty extends PropertyType {
    Editor = MultiPerson
    name = 'MultiPerson'
    type = 'multiPerson' as PropertyTypeEnum
    displayName = (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.MultiPerson', defaultMessage: 'Multi person'})
}
