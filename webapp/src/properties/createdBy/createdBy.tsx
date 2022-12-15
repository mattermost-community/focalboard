// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import Person from '../person/person'
import {PropertyProps} from '../types'

const CreatedBy = (props: PropertyProps): JSX.Element => {
    return (
        <Person
            {...props}
            propertyValue={props.item.createdBy}
            readOnly={true} // created by is an immutable property, so will always be readonly
        />
    )
}

export default CreatedBy
