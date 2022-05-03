// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import Select from 'react-select'
import {CSSObject} from '@emotion/serialize'

import {IUser} from '../../../user'
import {getBoardUsersList, getBoardUsers} from '../../../store/users'
import {useAppSelector} from '../../../store/hooks'

import './user.scss'
import {getSelectBaseStyle} from '../../../theme'

const imageURLForUser = (window as any).Components?.imageURLForUser

type Props = {
    value: string | string[],
    readonly: boolean,
    onChange: (value: string[]) => void,
}

const selectStyles = {
    ...getSelectBaseStyle(),
    option: (provided: CSSObject, state: {isFocused: boolean}): CSSObject => ({
        ...provided,
        background: state.isFocused ? 'rgba(var(--center-channel-color-rgb), 0.1)' : 'rgb(var(--center-channel-bg-rgb))',
        color: state.isFocused ? 'rgb(var(--center-channel-color-rgb))' : 'rgb(var(--center-channel-color-rgb))',
        padding: '8px',
    }),
    control: (): CSSObject => ({
        border: 0,
        width: '100%',
        margin: '0',
    }),
    valueContainer: (provided: CSSObject): CSSObject => ({
        ...provided,
        padding: 'unset',
        overflow: 'unset',
    }),
    singleValue: (provided: CSSObject): CSSObject => ({
        ...provided,
        position: 'static',
        top: 'unset',
        transform: 'unset',
    }),
    menu: (provided: CSSObject): CSSObject => ({
        ...provided,
        width: 'unset',
        background: 'rgb(var(--center-channel-bg-rgb))',
        minWidth: '260px',
    }),
}

const formatOptionLabel = (user: any) => {
    let profileImg
    if (imageURLForUser) {
        profileImg = imageURLForUser(user.id)
    }

    return (
        <div className='UserProperty-item'>
            {profileImg && (
                <img
                    alt='UserProperty-avatar'
                    src={profileImg}
                />
            )}
            {user.username}
        </div>
    )
}

const UserProperty = (props: Props): JSX.Element => {
    const boardUsersById = useAppSelector<{[key:string]: IUser}>(getBoardUsers)

    let users: IUser[] = []
    if(typeof props.value === 'string') {
        users = [boardUsersById[props.value]]
    } else if(Array.isArray(props.value)) {
        users = props.value.map(id => boardUsersById[id])
    }

    if (props.readonly) {
        return (<div className='UserProperty octo-propertyvalue readonly'>{users ? users.map(user => formatOptionLabel(user)) : props.value}</div>)
    }

    const boardUsers = useAppSelector<IUser[]>(getBoardUsersList)
    return (
        <Select
            isMulti
            options={boardUsers}
            isSearchable={true}
            isClearable={true}
            backspaceRemovesValue={true}
            className={'UserProperty'}
            classNamePrefix={'react-select'}
            formatOptionLabel={formatOptionLabel}
            styles={selectStyles}
            placeholder={'Empty'}
            getOptionLabel={(o: IUser) => o.username}
            getOptionValue={(a: IUser) => a.id}
            value={users}
            onChange={(item, action) => {
                if (action.action === 'select-option') {
                    props.onChange(item.map(a => a.id) || [])
                } else if (action.action === 'clear') {
                    props.onChange([])
                } else if(action.action === 'remove-value') {
                    props.onChange(item.filter(a => a.id !== action.removedValue.id).map(b => b.id) || [])
                }
            }}
        />
    )
}

export default UserProperty
