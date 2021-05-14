// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {useIntl} from 'react-intl'
import {ActionMeta, FormatOptionLabelMeta, ValueType} from 'react-select'
import CreatableSelect from 'react-select/creatable'

import {IPropertyOption} from '../blocks/board'
import {Constants} from '../constants'

import {getSelectBaseStyle} from '../theme'

import Menu from './menu'
import MenuWrapper from './menuWrapper'
import IconButton from './buttons/iconButton'
import OptionsIcon from './icons/options'
import DeleteIcon from './icons/delete'
import Label from './label'

import './valueSelector.scss'

type Props = {
    options: IPropertyOption[]
    value?: IPropertyOption
    emptyValue: string
    onCreate: (value: string) => void
    onChange: (value: string) => void
    onChangeColor: (option: IPropertyOption, color: string) => void
    onDeleteOption: (option: IPropertyOption) => void
}

type LabelProps = {
    option: IPropertyOption
    meta: FormatOptionLabelMeta<IPropertyOption, false>
    onChangeColor: (option: IPropertyOption, color: string) => void
    onDeleteOption: (option: IPropertyOption) => void
}

const ValueSelectorLabel = React.memo((props: LabelProps): JSX.Element => {
    const {option, meta} = props
    const intl = useIntl()
    if (meta.context === 'value') {
        return <Label color={option.color}>{option.value}</Label>
    }
    return (
        <div className='value-menu-option'>
            <div className='label-container'>
                <Label color={option.color}>{option.value}</Label>
            </div>
            <MenuWrapper stopPropagationOnToggle={true}>
                <IconButton icon={<OptionsIcon/>}/>
                <Menu position='left'>
                    <Menu.Text
                        id='delete'
                        icon={<DeleteIcon/>}
                        name={intl.formatMessage({id: 'BoardComponent.delete', defaultMessage: 'Delete'})}
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
                <Label color={props.value ? props.value.color : 'empty'}>
                    {props.value ? props.value.value : props.emptyValue}
                </Label>
            </div>
        )
    }
    return (
        <CreatableSelect
            isClearable={true}
            styles={getSelectBaseStyle()}
            formatOptionLabel={(option: IPropertyOption, meta: FormatOptionLabelMeta<IPropertyOption, false>) => (
                <ValueSelectorLabel
                    option={option}
                    meta={meta}
                    onChangeColor={props.onChangeColor}
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

export default ValueSelector
