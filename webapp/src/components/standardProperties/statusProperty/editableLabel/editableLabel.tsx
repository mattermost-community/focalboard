// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import Label from '../../../../widgets/label'

import {IPropertyOption} from '../../../../blocks/board'

import './editableLabel.scss'

type Props = {
    option: IPropertyOption
    editing?: boolean
}

const EditableLabel = (props: Props): JSX.Element => {
    const {option} = props

    const displayValue = (<span>{option.value}</span>)
    const editValue = (
        <input
            defaultValue={props.option.value}
        />
    )

    return (
        <Label
            key={option.id}
            color={option.color}
            title={option.value}
        >
            { props.editing ? editValue : displayValue }
        </Label>
    )
}

export default React.memo(EditableLabel)
