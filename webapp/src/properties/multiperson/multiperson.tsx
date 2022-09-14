// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react'
import Select from 'react-select'
import {CSSObject} from '@emotion/serialize'

import {getSelectBaseStyle} from '../../theme'
import {IUser} from '../../user'
import {Utils} from '../../utils'
import mutator from '../../mutator'
import {useAppSelector} from '../../store/hooks'
import {getBoardUsers, getBoardUsersList} from '../../store/users'

import {PropertyProps} from '../types'
import {ClientConfig} from '../../config/clientConfig'
import {getClientConfig} from '../../store/clientConfig'

import './multiperson.scss'

const imageURLForUser = (window as any).Components?.imageURLForUser

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

const MultiPerson = (props: PropertyProps) => {
    const {card, board, propertyTemplate, propertyValue, readOnly} = props

    const clientConfig = useAppSelector<ClientConfig>(getClientConfig)
    const boardUsersById = useAppSelector<{[key: string]: IUser}>(getBoardUsers)
    const boardUsers = useAppSelector<IUser[]>(getBoardUsersList)

    const formatOptionLabel = (user: any) => {
        if (!user) {
            return {}
        }
        let profileImg
        if (imageURLForUser) {
            profileImg = imageURLForUser(user.id)
        }

        return (
            <div
                key={user.id}
                className='MultiPerson-item'
            >
                {profileImg && (
                    <img
                        alt='MultiPerson-avatar'
                        src={profileImg}
                    />
                )}
                {Utils.getUserDisplayName(user, clientConfig.teammateNameDisplay)}
            </div>
        )
    }

    const onChange = useCallback((newValue) => mutator.changePropertyValue(board.id, card, propertyTemplate.id, newValue), [board.id, card, propertyTemplate.id])

    let users: IUser[] = []

    if (typeof propertyValue === 'string' && propertyValue !== '') {
        users = [boardUsersById[propertyValue as string]]
    } else if (Array.isArray(propertyValue) && propertyValue.length > 0) {
        users = propertyValue.map((id) => boardUsersById[id])
    }

    if (readOnly) {
        return (
            <div className={`MultiPerson ${props.property.valueClassName(true)}`}>
                {users ? users.map((user) => formatOptionLabel(user)) : propertyValue}
            </div>
        )
    }

    return (
        <Select
            isMulti={true}
            options={boardUsers}
            isSearchable={true}
            isClearable={true}
            placeholder={'Empty'}
            className={`MultiPerson ${props.property.valueClassName(props.readOnly)}`}
            classNamePrefix={'react-select'}
            formatOptionLabel={formatOptionLabel}
            styles={selectStyles}
            getOptionLabel={(o: IUser) => o.username}
            getOptionValue={(a: IUser) => a.id}
            value={users}
            onChange={(item, action) => {
                if (action.action === 'select-option') {
                    onChange(item.map((a) => a.id) || [])
                } else if (action.action === 'clear') {
                    onChange([])
                } else if (action.action === 'remove-value') {
                    onChange(item.filter((a) => a.id !== action.removedValue.id).map((b) => b.id) || [])
                }
            }}
        />
    )
}

export default MultiPerson
