// Copyright (c) 2024-present Midnight.Works. All Rights Reserved.
import {IntlShape} from 'react-intl'

import {PropertyType, PropertyTypeEnum, FilterValueType} from '../types'

import Checklist from './checklist'

export default class ChecklistProperty extends PropertyType {
    Editor = Checklist
    name = 'Checklist'
    type = 'checklist' as PropertyTypeEnum
    displayName = (intl: IntlShape) => intl.formatMessage({id: 'PropertyType.Checklist', defaultMessage: 'Checklist'})
    canFilter = false
    filterValueType = 'text' as FilterValueType
}
