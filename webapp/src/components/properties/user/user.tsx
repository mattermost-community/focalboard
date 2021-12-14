// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import Select from 'react-select'
import {CSSObject} from '@emotion/serialize'

import {IUser} from '../../../user'
import {getWorkspaceUsersList, getWorkspaceUsers} from '../../../store/users'
import {useAppSelector} from '../../../store/hooks'

import './user.scss'
import {getSelectBaseStyle} from '../../../theme'

const imageURLForUser = (window as any).Components?.imageURLForUser

type Props = {
    value: string,
    readonly: boolean,
    onChange: (value: string) => void,
}

const selectStyles = {
    ...getSelectBaseStyle(),
    placeholder: (provided: CSSObject): CSSObject => ({
        ...provided,
        color: 'rgba(var(--center-channel-color-rgb), 0.4)',
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
    const workspaceUsers = useAppSelector<IUser[]>(getWorkspaceUsersList)
    const workspaceUsersById = useAppSelector<{[key:string]: IUser}>(getWorkspaceUsers)

    if (props.readonly) {
        return (<div className='UserProperty octo-propertyvalue readonly'>{workspaceUsersById[props.value]?.username || props.value}</div>)
    }

    return (
        <Select
            options={workspaceUsers}
            isSearchable={true}
            isClearable={true}
            backspaceRemovesValue={true}
            className={'UserProperty octo-propertyvalue'}
            classNamePrefix={'react-select'}
            formatOptionLabel={formatOptionLabel}
            styles={selectStyles}
            placeholder={'Empty'}
            getOptionLabel={(o: IUser) => o.username}
            getOptionValue={(a: IUser) => a.id}
            value={workspaceUsersById[props.value] || null}
            onChange={(item, action) => {
                if (action.action === 'select-option') {
                    props.onChange(item?.id || '')
                } else if (action.action === 'clear') {
                    props.onChange('')
                }
            }}
        />
    )
}

export default UserProperty
