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
    value?: IPropertyOption
    emptyValue: string
    onCreate: (value: string) => void
    onChange: (value: string) => void
    onChangeColor: (option: IPropertyOption, color: string) => void
    onDeleteOption: (option: IPropertyOption) => void
    intl: IntlShape
}

type State = {
    activated: boolean
}

class ValueSelector extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            activated: false,
        }
    }

    shouldComponentUpdate(): boolean {
        return true
    }

    private renderLabel = (option: IPropertyOption, meta: FormatOptionLabelMeta<IPropertyOption>): React.ReactNode => {
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

    render(): JSX.Element {
        if (!this.state.activated) {
            return (
                <div
                    className='ValueSelector'
                    onClick={() => this.setState({activated: true})}
                >
                    <span className={`octo-label ${this.props.value ? this.props.value.color : 'empty'}`}>
                        {this.props.value ? this.props.value.value : this.props.emptyValue}
                    </span>
                </div>
            )
        }
        return (
            <CreatableSelect
                isClearable={true}
                styles={{
                    indicatorsContainer: (provided: CSSProperties): CSSProperties => ({
                        ...provided,
                        display: 'none',
                    }),
                    menu: (provided: CSSProperties): CSSProperties => ({
                        ...provided,
                        width: 'unset',
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
                    } else if (action.action === 'clear') {
                        this.props.onChange('')
                    }
                }}
                onCreateOption={this.props.onCreate}
                autoFocus={true}
                value={this.props.value}
                closeMenuOnSelect={true}
                placeholder={this.props.emptyValue}
                defaultMenuIsOpen={true}
            />
        )
    }
}

export default injectIntl(ValueSelector)
