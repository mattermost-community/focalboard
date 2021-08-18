// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import Select from 'react-select'

import {CSSObject} from '@emotion/serialize'

import {getUserWorkspaceList} from '../../store/users'
import {UserWorkspace} from '../../user'
import {useAppSelector} from '../../store/hooks'

import './workspaceOptions.scss'
import Search from '../../widgets/icons/search'

const style = {
    dropdownIndicator: (provided: CSSObject) => ({
        ...provided,
        fontSize: '14px',
        color: 'var(--center-channel-color-rgb)',
    }),
    input: (provided: CSSObject) => ({
        ...provided,
        fontSize: '14px',
        color: 'var(--center-channel-color-rgb)',
    }),
}

type Props = {
    onClose?: () => void
    onBlur?: () => void
    onChange: (value: string) => void
}

const WorkspaceOptions = (props: Props): JSX.Element => {
    const userWorkspaces = useAppSelector<UserWorkspace[]>(getUserWorkspaceList)
    const options = userWorkspaces.map((workspace) => {
        return {
            label: workspace.title,
            value: workspace.id,
            boardCount: workspace.boardCount,
        }
    })

    return (
        <Select
            classNamePrefix={'WorkspaceOptions'}
            autoFocus={true}
            style={style}
            backspaceRemovesValue={false}
            controlShouldRenderValue={false}
            hideSelectedOptions={false}
            isClearable={false}
            placeholder={'Search...'}
            tabSelectsValue={false}
            options={options}
            menuIsOpen={true}
            onMenuClose={() => {
                if (props.onClose) {
                    props.onClose()
                }
            }}
            onBlur={() => {
                if (props.onBlur) {
                    props.onBlur()
                }
            }}
            components={{
                DropdownIndicator: Search,
                IndicatorSeparator: null,
                Option,
            }}
            onChange={(item) => {
                if (item?.value) {
                    props.onChange(item.value)
                }
            }}
        />
    )
}

const Option = (props: any): JSX.Element => {
    const {innerProps, innerRef} = props

    return (
        <div
            ref={innerRef}
            {...innerProps}
            className={`workspaceOption ${props.isFocused ? 'focused' : ''}`}
        >
            <div className='workspaceTitle'>
                {props.data.label}
            </div>
            <div className='boardCount'>
                {props.data.boardCount} {props.data.boardCount > 1 ? 'Boards' : 'Board'}
            </div>
        </div>
    )
}

export default WorkspaceOptions
