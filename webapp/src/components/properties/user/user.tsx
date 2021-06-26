// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useContext} from 'react'
import Select from 'react-select'

import {IUser, WorkspaceUsersContext, WorkspaceUsersContextData} from '../../../user'

import './user.scss'
import {getSelectBaseStyle} from '../../../theme'

type Props = {
    value: string,
    readonly: boolean,
    onChange: (value: string) => void,
    tooltip?: string
}

const UserProperty = (props: Props): JSX.Element => {
    const workspaceUsers = useContext<WorkspaceUsersContextData>(WorkspaceUsersContext)
    const tooltipClassName = props.tooltip ? 'octo-tooltip tooltip-top' : ''

    if (props.readonly) {
        const userClassName = `UserProperty octo-propertyvalue ${tooltipClassName}`
        return (
            <div
                className={userClassName}
                data-tooltip={props.tooltip}
            >
                {workspaceUsers.usersById.get(props.value)?.username || props.value}</div>)
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
