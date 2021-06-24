// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useContext} from 'react'
import Select from 'react-select'

import {IUser, WorkspaceUsersContext, WorkspaceUsers} from '../../../user'

import './user.scss'
import {getSelectBaseStyle} from '../../../theme'

type Props = {
    value: string,
    readonly: boolean,
    onChange: (value: string) => void,
}

const UserProperty = (props: Props): JSX.Element => {
    const workspaceUsers = useContext<WorkspaceUsers>(WorkspaceUsersContext)

    if (props.readonly) {
        return (<div className='UserProperty octo-propertyvalue readonly'>{workspaceUsers.usersById.get(props.value)?.username || props.value}</div>)
    }

    return (
        <Select
            options={workspaceUsers.users}
            isSearchable={true}
            isClearable={true}
            backspaceRemovesValue={true}
            className={'UserProperty'}
            styles={getSelectBaseStyle()}
            getOptionLabel={(o: IUser) => o.username}
            getOptionValue={(a: IUser) => a.id}
            value={workspaceUsers.usersById.get(props.value) || null}
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
