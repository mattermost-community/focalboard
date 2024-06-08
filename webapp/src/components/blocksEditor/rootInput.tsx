// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {useIntl} from 'react-intl'
import Select from 'react-select'
import {CSSObject} from '@emotion/serialize'

import {getSelectBaseStyle} from '../../theme'

import * as registry from './blocks/'
import {ContentType} from './blocks/types'

type Props = {
    onChange: (value: string) => void
    onChangeType: (blockType: ContentType) => void
    onSave: (value: string, blockType: string) => void
    value: string
}

const baseStyles = getSelectBaseStyle()

const styles = {
    ...baseStyles,
    control: (provided: CSSObject): CSSObject => ({
        ...provided,
        width: '100%',
        height: '100%',
        display: 'flex',
        background: 'rgb(var(--center-channel-bg-rgb))',
        color: 'rgb(var(--center-channel-color-rgb))',
        flexDirection: 'row',
        border: 0,
    }),
    input: (provided: CSSObject): CSSObject => ({
        ...provided,
        background: 'rgb(var(--center-channel-bg-rgb))',
        color: 'rgb(var(--center-channel-color-rgb))',
    }),
    menu: (provided: CSSObject): CSSObject => ({
        ...provided,
        minWidth: '100%',
        width: 'max-content',
        background: 'rgb(var(--center-channel-bg-rgb))',
        left: '0',
        marginBottom: '0',
    }),
    menuPortal: (provided: CSSObject): CSSObject => ({
        ...provided,
        zIndex: 999,
    }),
    placeholder: (provided: CSSObject): CSSObject => ({
        ...provided,
        zIndex: 10,
    }),
}

export default function RootInput(props: Props) {
    const [showMenu, setShowMenu] = useState(false)
    const intl = useIntl()

    const formatOptionLabel = (ct: ContentType) => (
        <div className='slash-command'>
            <div className='slash-command__icon'>{ct.icon}</div>
            <div className='slash-command__info'>
                <div className='slash-command__title'>{ct.slashCommand}</div>
                <div className='slash-command__desc'>
                    {`Creates a new ${ct.displayName} block.`}
                </div>
            </div>
        </div>
    )

    return (
        <Select
            styles={styles}
            components={{DropdownIndicator: () => null, IndicatorSeparator: () => null}}
            className='RootInput'
            classNamePrefix={'RootInput'}
            placeholder={intl.formatMessage({id: 'BlocksEditor.root-input-placeholder', defaultMessage: 'Add text or type "/" for commands'})}
            autoFocus={true}
            menuIsOpen={showMenu}
            menuPortalTarget={document.getElementById('focalboard-root-portal')}
            menuPosition={'fixed'}
            options={registry.list()}
            formatOptionLabel={formatOptionLabel}
            getOptionValue={(ct: ContentType) => ct.slashCommand}
            filterOption={(option: any, inputValue: string): boolean => {
                return inputValue.startsWith(option.value) || option.value.startsWith(inputValue)
            }}
            inputValue={props.value}
            onInputChange={(inputValue: string) => {
                props.onChange(inputValue)
                if (inputValue.startsWith('/')) {
                    setShowMenu(true)
                } else {
                    setShowMenu(false)
                }
            }}
            onChange={(ct: ContentType|null) => {
                if (ct) {
                    const args = props.value.split(' ').slice(1)
                    ct.runSlashCommand(props.onChangeType, props.onChange, ...args)
                }
            }}
            onBlur={() => {
                const command = props.value.trimStart().split(' ')[0]
                const block = registry.getBySlashCommandPrefix(command)
                if (command === '' || !block) {
                    props.onSave(props.value, 'text')
                    props.onChange('')
                }
            }}
            onFocus={(e: React.FocusEvent) => {
                const target = e.currentTarget
                target.scrollIntoView({block: 'center'})
            }}
            onKeyDown={(e) => {
                if (e.key === 'Escape') {
                    props.onSave('', 'text')
                    props.onChange('')
                }
                if (e.key === 'Enter') {
                    const command = props.value.trimStart().split(' ')[0]
                    const block = registry.getBySlashCommandPrefix(command)
                    if (command === '' || !block) {
                        e.preventDefault()
                        e.stopPropagation()
                        props.onSave(props.value, 'text')
                        props.onChange('')
                    }
                }
            }}
        />
    )
}

