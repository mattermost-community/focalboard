// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IntlShape} from 'react-intl'

import {Options} from '../../components/calculations/options'
import {IPropertyTemplate} from '../../blocks/board'
import {Card} from '../../blocks/card'
import {Page} from '../../blocks/page'
import {Utils} from '../../utils'
import {DatePropertyType, PropertyTypeEnum} from '../types'

import UpdatedTime from './updatedTime'

export default class UpdatedTimeProperty extends DatePropertyType {
    Editor = UpdatedTime
    name = 'Last Modified At'
    type = 'updatedTime' as PropertyTypeEnum
    isReadOnly = true
    displayName = (intl: IntlShape) => intl.formatMessage({id: 'PropertyType.UpdatedTime', defaultMessage: 'Last updated time'})
    calculationOptions = [Options.none, Options.count, Options.countEmpty,
        Options.countNotEmpty, Options.percentEmpty, Options.percentNotEmpty,
        Options.countValue, Options.countUniqueValue, Options.earliest,
        Options.latest, Options.dateRange]
    displayValue = (_1: string | string[] | undefined, item: Card|Page, _2: IPropertyTemplate, intl: IntlShape) => Utils.displayDateTime(new Date(item.updateAt), intl)
    getDateFrom = (_: string | string[] | undefined, item: Card|Page) => new Date(item.updateAt || 0)
    getDateTo = (_: string | string[] | undefined, item: Card|Page) => new Date(item.updateAt || 0)
}
