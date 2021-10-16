// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {useIntl} from 'react-intl'

import {Utils} from '../../../utils'
import './createdAt.scss'

type Props = {
    createAt: number
}

const CreatedAt = (props: Props): JSX.Element => {
    const intl = useIntl()
    return (
        <div className='CreatedAt octo-propertyvalue readonly'>
            {Utils.displayDateTime(new Date(props.createAt), intl)}
        </div>
    )
}

export default CreatedAt
