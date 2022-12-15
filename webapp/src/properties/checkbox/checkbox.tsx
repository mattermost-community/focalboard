// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import mutator from '../../mutator'
import Switch from '../../widgets/switch'

import {PropertyProps} from '../types'

const Checkbox = (props: PropertyProps): JSX.Element => {
    const {item, board, propertyTemplate, propertyValue} = props
    return (
        <Switch
            isOn={Boolean(propertyValue)}
            onChanged={(newBool: boolean) => {
                const newValue = newBool ? 'true' : ''
                mutator.changePropertyValue(board.id, item, propertyTemplate?.id || '', newValue)
            }}
            readOnly={props.readOnly}
        />
    )
}
export default Checkbox
