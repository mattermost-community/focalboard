// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'

import Label from '../../../../widgets/label'

import {IPropertyOption} from '../../../../blocks/board'

import './editableLabel.scss'

type Props = {
    option: IPropertyOption
    editing?: boolean
    onBlur?: (newOptionValue: IPropertyOption) => void
}

const EditableLabel = (props: Props): JSX.Element => {
    const [value, setValue] = useState<string>(props.option.value)

    const handleOnBlur = () => {
        const newOptionValue = {
            ...props.option,
            value,
        }

        if (props.onBlur) {
            props.onBlur(newOptionValue)
        }
    }

    const displayValue = (<span>{props.option.value}</span>)
    const editValue = (
        <input
            defaultValue={props.option.value}
            autoFocus={true}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleOnBlur}
        />
    )

    return (
        <Label
            key={props.option.id}
            className='EditableLabel'
            color={props.option.color}
            title={props.option.value}
        >
            { props.editing ? editValue : displayValue }
        </Label>
    )
}

export default React.memo(EditableLabel)
