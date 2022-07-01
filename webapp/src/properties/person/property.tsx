import {IntlShape} from 'react-intl'
import Person from './person'
import {PropertyType, PropertyTypeEnum} from '../types'

export default class PersonProperty extends PropertyType {
    Editor = Person
    name = 'Person'
    type = 'person' as PropertyTypeEnum
    displayName = (intl:IntlShape) => intl.formatMessage({id: 'PropertyType.Person', defaultMessage: 'Person'})
}
