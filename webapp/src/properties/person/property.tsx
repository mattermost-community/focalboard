// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IntlShape} from 'react-intl'

import {PropertyType, PropertyTypeEnum} from '../types'

import Person from './person'

export default class PersonProperty extends PropertyType {
    Editor = Person
    name = 'Person'
    type = 'person' as PropertyTypeEnum
    displayName = (intl: IntlShape) => intl.formatMessage({id: 'PropertyType.Person', defaultMessage: 'Person'})
}
