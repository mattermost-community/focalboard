// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {PropertyProps} from '../types'
import BaseTextEditor from '../baseTextEditor'

const Number = (props: PropertyProps): JSX.Element => {
    return (
        <BaseTextEditor
            {...props}
            validator={() => props.propertyValue === '' || !isNaN(parseInt(props.propertyValue as string, 10))}
        />
    )
}
export default Number
