// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {CSSProperties} from 'react'
import {ActionMeta, ValueType} from 'react-select'
import CreatableSelect from 'react-select/creatable';
import boardCard from 'src/components/boardCard';
import {IPropertyOption} from '../blocks/board'

import './valueSelector.scss'

type Props = {
    options: IPropertyOption[]
    value: IPropertyOption;
    onCreate?: (value: string) => void
    onChange?: (value: string) => void
}

export default class ValueSelector extends React.Component<Props> {
    public shouldComponentUpdate(): boolean {
        return true
    }

    public render(): JSX.Element {
        return (
            <CreatableSelect
                styles={{
                    indicatorsContainer: (provided: CSSProperties): CSSProperties => ({
                        ...provided,
                        display: 'none',
                    }),
                    menu: (provided: CSSProperties): CSSProperties => ({
                        ...provided,
                        background: 'rgb(var(--main-bg))',
                    }),
                    option: (provided: CSSProperties, state: {isFocused: boolean}): CSSProperties => ({
                        ...provided,
                        background: state.isFocused ? 'rgb(var(--button-bg))' : 'rgb(var(--main-bg))',
                        color: state.isFocused ? 'rgb(var(--button-fg))' : 'rgb(var(--main-fg))',
                        padding: '2px 8px',
                    }),
                    control: (): CSSProperties => ({
                        border: 0,
                    }),
                    valueContainer: (provided: CSSProperties): CSSProperties => ({
                        ...provided,
                        padding: '0 8px',
                    }),
                    singleValue: (provided: CSSProperties): CSSProperties => ({
                        ...provided,
                        color: 'rgb(var(--main-fg))',
                    }),
                    input: (provided: CSSProperties): CSSProperties => ({
                        ...provided,
                        paddingBottom: 0,
                        paddingTop: 0,
                        marginBottom: 0,
                        marginTop: 0,
                    }),
                }}
                className='ValueSelector'
                hideSelectedOptions={true}
                options={this.props.options}
                getOptionLabel={(o: IPropertyOption) => o.value}
                getOptionValue={(o: IPropertyOption) => o.id}
                onChange={(value: ValueType<IPropertyOption>, action: ActionMeta<IPropertyOption>): void => {
                    if (action.action === 'select-option') {
                        this.props.onChange((value as IPropertyOption).id)
                    }
                }}
                onCreateOption={this.props.onCreate}
                autoFocus={true}
                value={this.props.value}
                closeMenuOnSelect={true}
            />
        )
    }
}
