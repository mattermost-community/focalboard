// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState} from 'react'

import {IPropertyOption, IPropertyTemplate} from '../../../blocks/board'

import Label from '../../../widgets/label'
import ValueSelector from '../../../widgets/valueSelector'

type Props = {
    emptyValue: string
    propertyValue: string
    propertyTemplate: IPropertyTemplate
    onCreate: (value: string) => void
    onChange: (value: string) => void
    onChangeColor: (option: IPropertyOption, color: string) => void
    onDeleteOption: (option: IPropertyOption) => void
    onDeleteValue: () => void;
    isEditable: boolean
}

const SelectProperty = (props: Props) => {
    const {emptyValue, propertyValue, propertyTemplate, isEditable} = props
    const [open, setOpen] = useState(false)

    const option = propertyTemplate.options.find((o) => o.id === propertyValue)
    const propertyColorCssClassName = option?.color || ''
    const displayValue = option?.value
    const finalDisplayValue = displayValue || emptyValue

    if (!isEditable || !open) {
        return (
            <div
                className='octo-propertyvalue'
                data-testid='select-non-editable'
                tabIndex={0}
                onClick={() => setOpen(true)}
            >
                <Label color={displayValue ? propertyColorCssClassName : 'empty'}>
                    <span className='Label-text'>{finalDisplayValue}</span>
                </Label>
            </div>
        )
    }
    return (
        <ValueSelector
            emptyValue={emptyValue}
            options={propertyTemplate.options}
            value={propertyTemplate.options.find((p) => p.id === propertyValue)}
            onCreate={props.onCreate}
            onChange={(value) => props.onChange(value as string)}
            onChangeColor={props.onChangeColor}
            onDeleteOption={props.onDeleteOption}
            onDeleteValue={props.onDeleteValue}
            onBlur={() => setOpen(false)}
        />
    )
}

export default React.memo(SelectProperty)
