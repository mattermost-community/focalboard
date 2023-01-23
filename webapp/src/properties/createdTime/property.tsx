// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IntlShape} from 'react-intl'

import {Options} from '../../components/calculations/options'
import {IPropertyTemplate} from '../../blocks/board'
import {Card} from '../../blocks/card'
import {Page} from '../../blocks/page'
import {Utils} from '../../utils'

import {DatePropertyType, PropertyTypeEnum} from '../types'

import CreatedTime from './createdTime'

export default class CreatedAtProperty extends DatePropertyType {
    Editor = CreatedTime
    name = 'Created At'
    type = 'createdTime' as PropertyTypeEnum
    isReadOnly = true
    displayName = (intl: IntlShape) => intl.formatMessage({id: 'PropertyType.CreatedTime', defaultMessage: 'Created time'})
    calculationOptions = [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue, Options.earliest,
        Options.latest, Options.dateRange]
    displayValue = (_1: string | string[] | undefined, item: Card|Page, _2: IPropertyTemplate, intl: IntlShape) => Utils.displayDateTime(new Date(item.createAt), intl)
}
