// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {IPropertyOption} from '../../blocks/board'

import ValueSelector from '../../widgets/valueSelector'

type Props = {
    emptyValue: string;
    options: IPropertyOption[];
    values: IPropertyOption[];
    onChange: (value: string | string[]) => void;
    onChangeColor: (option: IPropertyOption, color: string) => void;
    onDeleteOption: (option: IPropertyOption) => void;
    onCreate: (value: string) => void;
}

const MultiSelectProperty = (props: Props): JSX.Element => {
    const {emptyValue, options, values, onChange, onChangeColor, onDeleteOption, onCreate} = props

    return (
        <ValueSelector
            isMulti={true}
            emptyValue={emptyValue}
            options={options}
            value={values}
            onChange={onChange}
            onChangeColor={onChangeColor}
            onDeleteOption={onDeleteOption}
            onDeleteValue={(valueToRemove) => onChange(values.filter(value => value.id !== valueToRemove.id).map(value => value.id))}
            onCreate={onCreate}
        />
    )
}

export default MultiSelectProperty
