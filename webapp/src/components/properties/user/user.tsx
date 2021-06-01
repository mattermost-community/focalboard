// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import Select from 'react-select'

import {IUser, WorkspaceUsersContext} from '../../../user'

import './user.scss'
import {getSelectBaseStyle} from '../../../theme'

type Props = {
    value: string,
    readonly: boolean,
    onChange: (value: string) => void,
}

const UserProperty = (props: Props): JSX.Element => {
    let value: IUser | undefined

    if (props.readonly) {
        return (<div className='UserProperty octo-propertyvalue'>{value ? value.username : props.value}</div>)
    }

    return (
        <WorkspaceUsersContext.Consumer>
            {(workspaceUsers) => (
                <Select
                    options={workspaceUsers}
                    isSearchable={true}
                    isClearable={true}
                    backspaceRemovesValue={true}
                    className={'UserProperty'}
                    styles={getSelectBaseStyle()}
                    getOptionLabel={(o: IUser) => o.username}
                    getOptionValue={(a: IUser) => a.id}
                    value={workspaceUsers?.find((user: IUser) => user.id === props.value)}
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
        </WorkspaceUsersContext.Consumer>
    )
}

export default UserProperty
