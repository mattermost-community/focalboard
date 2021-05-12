// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useState} from 'react'
import Select from 'react-select'

import {CSSObject} from '@emotion/serialize'

import {IUser} from '../../../user'
import octoClient from '../../../octoClient'

import './user.scss'

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

            styles={{
                dropdownIndicator: (provided: CSSObject): CSSObject => ({
                    ...provided,
                    display: 'none !important',
                }),
                indicatorSeparator: (provided: CSSObject): CSSObject => ({
                    ...provided,
                    display: 'none',
                }),
                loadingIndicator: (provided: CSSObject): CSSObject => ({
                    ...provided,
                    display: 'none',
                }),
                menu: (provided: CSSObject): CSSObject => ({
                    ...provided,
                    width: 'unset',
                    background: 'rgb(var(--main-bg))',
                }),
                option: (provided: CSSObject, state: {isFocused: boolean}): CSSObject => ({
                    ...provided,
                    background: state.isFocused ? 'rgba(var(--main-fg), 0.1)' : 'rgb(var(--main-bg))',
                    color: state.isFocused ? 'rgb(var(--main-fg))' : 'rgb(var(--main-fg))',
                    padding: '2px 8px',
                }),
                control: (): CSSObject => ({
                    border: 0,
                    width: '100%',
                    margin: '4px 0 0 0',
                    display: 'flex',
                    marginTop: 0,
                }),
                valueContainer: (provided: CSSObject): CSSObject => ({
                    ...provided,
                    padding: '0 8px',
                    overflow: 'unset',
                    height: '20px',
                }),
                singleValue: (provided: CSSObject): CSSObject => ({
                    ...provided,
                    color: 'rgb(var(--main-fg))',
                    overflow: 'unset',
                    maxWidth: 'calc(100% - 20px)',
                }),
                input: (provided: CSSObject): CSSObject => ({
                    ...provided,
                    paddingBottom: 0,
                    paddingTop: 0,
                    marginBottom: 0,
                    marginTop: 0,
                }),
                menuList: (provided: CSSObject): CSSObject => ({
                    ...provided,
                    overflowY: 'unset',
                }),
                clearIndicator: (provided: CSSObject): CSSObject => ({
                    ...provided,
                    padding: 0,
                }),
            }}
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
