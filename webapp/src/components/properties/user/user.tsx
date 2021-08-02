// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import Select from 'react-select'

import {IUser} from '../../../user'
import {getWorkspaceUsersList, getWorkspaceUsers} from '../../../store/users'
import {useAppSelector} from '../../../store/hooks'

import './user.scss'
import {getSelectBaseStyle} from '../../../theme'

type Props = {
    value: string,
    readonly: boolean,
    onChange: (value: string) => void,
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
            className={'UserProperty'}
            styles={getSelectBaseStyle()}
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
