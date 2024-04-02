// Copyright (c) 2024-present Midnight.Works. All Rights Reserved.
import {IntlShape} from 'react-intl'

import {PropertyType, PropertyTypeEnum, FilterValueType} from '../types'

import Label from './labels'

export default class LabelsProperty extends PropertyType {
    Editor = Label
    name = 'Labels'
    type = 'labels' as PropertyTypeEnum
    displayName = (intl: IntlShape) => intl.formatMessage({id: 'PropertyType.Lables', defaultMessage: 'Labels'})
    canFilter = false
    filterValueType = 'text' as FilterValueType
}
