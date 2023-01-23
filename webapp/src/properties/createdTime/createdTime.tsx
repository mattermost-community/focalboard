// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {useIntl} from 'react-intl'

import {Utils} from '../../utils'
import {PropertyProps} from '../types'
import './createdTime.scss'

const CreatedTime = (props: PropertyProps): JSX.Element => {
    const intl = useIntl()
    return (
        <div className={`CreatedTime ${props.property.valueClassName(true)}`}>
            {Utils.displayDateTime(new Date(props.item.createAt), intl)}
        </div>
    )
}

export default CreatedTime
