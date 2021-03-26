// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {injectIntl, IntlShape} from 'react-intl'
import {ActionMeta, ValueType, FormatOptionLabelMeta} from 'react-select'
import CreatableSelect from 'react-select/creatable'
import {CSSObject} from '@emotion/serialize'

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

type LabelProps = {
    option: IPropertyOption
    meta: FormatOptionLabelMeta<IPropertyOption, false>
    onChangeColor: (option: IPropertyOption, color: string) => void
    onDeleteOption: (option: IPropertyOption) => void
    intl: IntlShape
}

const ValueSelectorLabel = React.memo((props: LabelProps): JSX.Element => {
    const {option, meta} = props
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
                        name={props.intl.formatMessage({id: 'BoardComponent.delete', defaultMessage: 'Delete'})}
                        onClick={() => props.onDeleteOption(option)}
                    />
                    <Menu.Separator/>
                    {Constants.menuColors.map((color) => (
                        <Menu.Color
                            key={color.id}
                            id={color.id}
                            name={color.name}
                            onClick={() => props.onChangeColor(option, color.id)}
                        />
                    ))}
                </Menu>
            </MenuWrapper>
        </div>
    )
})

function ValueSelector(props: Props): JSX.Element {
    const [activated, setActivated] = useState(false)

    if (!activated) {
        return (
            <div
                className='ValueSelector'
                onClick={() => setActivated(true)}
            >
                <span className={`octo-label ${props.value ? props.value.color : 'empty'}`}>
                    {props.value ? props.value.value : props.emptyValue}
                </span>
            </div>
        )
    }
    return (
        <CreatableSelect
            isClearable={true}
            styles={{
                indicatorsContainer: (provided: CSSObject): CSSObject => ({
                    ...provided,
                    display: 'none',
                }),
                menu: (provided: CSSObject): CSSObject => ({
                    ...provided,
                    width: 'unset',
                    background: 'rgb(var(--main-bg))',
                }),
                option: (provided: CSSObject, state: {isFocused: boolean}): CSSObject => ({
                    ...provided,
                    background: state.isFocused ? 'rgba(var(--main-fg), 0.1)' : 'rgb(var(--main-bg))',
                    color: state.isFocused ? 'rgb(var(--main-fg))' : 'rgb(var(--main-fg))',
                    padding: '2px 8px',
                }),
                control: (): CSSObject => ({
                    border: 0,
                }),
                valueContainer: (provided: CSSObject): CSSObject => ({
                    ...provided,
                    padding: '0 8px',
                }),
                singleValue: (provided: CSSObject): CSSObject => ({
                    ...provided,
                    color: 'rgb(var(--main-fg))',
                }),
                input: (provided: CSSObject): CSSObject => ({
                    ...provided,
                    paddingBottom: 0,
                    paddingTop: 0,
                    marginBottom: 0,
                    marginTop: 0,
                }),
                menuList: (provided: CSSObject): CSSObject => ({
                    ...provided,
                    overflowY: 'unset',
                }),
            }}
            formatOptionLabel={(option: IPropertyOption, meta: FormatOptionLabelMeta<IPropertyOption, false>) => (
                <ValueSelectorLabel
                    option={option}
                    meta={meta}
                    onChangeColor={props.onChangeColor}
                    intl={props.intl}
                    onDeleteOption={props.onDeleteOption}
                />
            )}
            className='ValueSelector'
            options={props.options}
            getOptionLabel={(o: IPropertyOption) => o.value}
            getOptionValue={(o: IPropertyOption) => o.id}
            onChange={(value: ValueType<IPropertyOption, false>, action: ActionMeta<IPropertyOption>): void => {
                if (action.action === 'select-option') {
                    props.onChange((value as IPropertyOption).id)
                } else if (action.action === 'clear') {
                    props.onChange('')
                }
            }}
            onCreateOption={props.onCreate}
            autoFocus={true}
            value={props.value}
            closeMenuOnSelect={true}
            placeholder={props.emptyValue}
            defaultMenuIsOpen={true}
        />
    )
}

export default injectIntl(ValueSelector)
