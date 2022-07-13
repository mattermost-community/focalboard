import {IntlShape} from 'react-intl'
import UpdatedBy from './updatedBy'
import {PropertyType, PropertyTypeEnum} from '../types'

export default class UpdatedByProperty extends PropertyType {
    Editor = UpdatedBy
    name = 'Last Modified By'
    type = 'updatedBy' as PropertyTypeEnum
    isReadOnly = true
    displayName = (intl: IntlShape) => intl.formatMessage({id: 'PropertyType.UpdatedBy', defaultMessage: 'Last updated by'})
}
