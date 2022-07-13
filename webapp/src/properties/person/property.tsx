import {IntlShape} from 'react-intl'

import {PropertyType, PropertyTypeEnum} from '../types'

import Person from './person'

export default class PersonProperty extends PropertyType {
    Editor = Person
    name = 'Person'
    type = 'person' as PropertyTypeEnum
    displayName = (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Person', defaultMessage: 'Person'})
}
