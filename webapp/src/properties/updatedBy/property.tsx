import {IntlShape} from 'react-intl'

import {PropertyType, PropertyTypeEnum} from '../types'

import UpdatedBy from './updatedBy'

export default class UpdatedByProperty extends PropertyType {
    Editor = UpdatedBy
    name = 'Last Modified By'
    type = 'updatedBy' as PropertyTypeEnum
    isReadOnly = true
    displayName = (intl: IntlShape) => intl.formatMessage({id: 'PropertyType.UpdatedBy', defaultMessage: 'Last updated by'})
}
