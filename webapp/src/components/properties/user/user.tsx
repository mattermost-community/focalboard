// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useState} from 'react'
import Select from 'react-select'

import {IUser} from '../../../user'
import octoClient from '../../../octoClient'

import './user.scss'
import {getSelectBaseStyle} from '../../../theme'

type Props = {
    value: string,
    onChange: (value: string) => void,
}

const UserProperty = (props: Props): JSX.Element => {
    const [users, setState] = useState<Array<IUser>>([])

    useEffect(() => {
        if (users.length === 0) {
            const getWorkspaceUsers = async () => {
                const workspaceUsers = await octoClient.getWorkspaceUsers()
                setState(workspaceUsers)
            }

            getWorkspaceUsers()
        }
    })

    let value: IUser | undefined

    if (props.value) {
        value = users.find((user) => user.id === props.value)
    }

    return (
        <Select
            options={users}
            isSearchable={true}
            isClearable={true}
            backspaceRemovesValue={true}
            className={'user-picker'}
            styles={getSelectBaseStyle()}
            getOptionLabel={(o: IUser) => o.username}
            getOptionValue={(a: IUser) => a.id}
            value={value}
            onChange={(item, action) => {
                if (action.action === 'select-option') {
                    props.onChange(item?.id || '')
                } else if (action.action === 'clear') {
                    props.onChange('')
                }
            }}
        />)
}

export default UserProperty
