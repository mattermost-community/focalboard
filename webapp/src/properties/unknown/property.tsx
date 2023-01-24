// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IntlShape} from 'react-intl'

import Text from '../text/text'
import {PropertyType, PropertyTypeEnum} from '../types'

export default class UnkownProperty extends PropertyType {
    Editor = Text
    name = 'Text'
    type = 'unknown' as PropertyTypeEnum
    displayName = (intl: IntlShape) => intl.formatMessage({id: 'PropertyType.Unknown', defaultMessage: 'Unknown'})
}
