import {IntlShape} from 'react-intl'
import CreatedBy from './createdBy'
import {PropertyType, PropertyTypeEnum} from '../types'

export default class CreatedByProperty extends PropertyType {
    Editor = CreatedBy
    name = 'Created By'
    type = 'createdBy' as PropertyTypeEnum
    isReadOnly = true
    displayName = (intl: IntlShape) => intl.formatMessage({id: 'PropertyType.CreatedBy', defaultMessage: 'Created by'})
}
