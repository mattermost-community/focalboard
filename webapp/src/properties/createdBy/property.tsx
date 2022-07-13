import {IntlShape} from 'react-intl'

import {PropertyType, PropertyTypeEnum} from '../types'

import CreatedBy from './createdBy'

export default class CreatedByProperty extends PropertyType {
    Editor = CreatedBy
    name = 'Created By'
    type = 'createdBy' as PropertyTypeEnum
    isReadOnly = true
    displayName = (intl: IntlShape) => intl.formatMessage({id: 'PropertyType.CreatedBy', defaultMessage: 'Created by'})
}
