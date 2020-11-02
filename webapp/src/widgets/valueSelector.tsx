// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {CSSProperties} from 'react'
import {injectIntl, IntlShape} from 'react-intl'
import {ActionMeta, ValueType, FormatOptionLabelMeta} from 'react-select'
import CreatableSelect from 'react-select/creatable'

import {IPropertyOption} from '../blocks/board'
import {Constants} from '../constants'

import Menu from './menu'
import MenuWrapper from './menuWrapper'
import IconButton from './buttons/iconButton'
import OptionsIcon from './icons/options'
import DeleteIcon from './icons/delete'

import './valueSelector.scss'

type Props = {
    options: IPropertyOption[]
    value: IPropertyOption;
    onCreate?: (value: string) => void
    onChange?: (value: string) => void
    onChangeColor?: (option: IPropertyOption, color: string) => void
    onDeleteOption?: (option: IPropertyOption) => void
    intl: IntlShape
}

class ValueSelector extends React.Component<Props> {
    public shouldComponentUpdate(): boolean {
        return true
    }

    renderLabel = (option: IPropertyOption, meta: FormatOptionLabelMeta<IPropertyOption>): React.ReactNode => {
        if (meta.context === 'value') {
            return <span className={`octo-label ${option.color}`} >{option.value}</span>
        }
        return (
            <div className='value-menu-option'>
                <div className='octo-label-container'>
                    <div className={`octo-label ${option.color}`}>{option.value}</div>
                </div>
                <MenuWrapper stopPropagationOnToggle={true}>
                    <IconButton icon={<OptionsIcon/>}/>
                    <Menu position='left'>
                        <Menu.Text
                            id='delete'
                            icon={<DeleteIcon/>}
                            name={this.props.intl.formatMessage({id: 'BoardComponent.delete', defaultMessage: 'Delete'})}
                            onClick={() => this.props.onDeleteOption(option)}
                        />
                        <Menu.Separator/>
                        {Constants.menuColors.map((color) => (
                            <Menu.Color
                                key={color.id}
                                id={color.id}
                                name={color.name}
                                onClick={() => this.props.onChangeColor(option, color.id)}
                            />
                        ))}
                    </Menu>
                </MenuWrapper>
            </div>
        )
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
                        background: state.isFocused ? 'rgba(var(--main-fg), 0.1)' : 'rgb(var(--main-bg))',
                        color: state.isFocused ? 'rgb(var(--main-fg))' : 'rgb(var(--main-fg))',
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
                    menuList: (provided: CSSProperties): CSSProperties => ({
                        ...provided,
                        overflowY: 'unset',
                    }),
                }}
                formatOptionLabel={this.renderLabel}
                className='ValueSelector'
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

export default injectIntl(ValueSelector)
