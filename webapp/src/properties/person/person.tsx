// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react'
import Select from 'react-select'
import {CSSObject} from '@emotion/serialize'

import {Utils} from '../../utils'
import {IUser} from '../../user'
import {getBoardUsersList, getBoardUsers} from '../../store/users'
import {useAppSelector} from '../../store/hooks'
import mutator from '../../mutator'
import {getSelectBaseStyle} from '../../theme'
import {ClientConfig} from '../../config/clientConfig'
import {getClientConfig} from '../../store/clientConfig'

import {PropertyProps} from '../types'

import './person.scss'

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

const Person = (props: PropertyProps): JSX.Element => {
    const {card, board, propertyTemplate, propertyValue, readOnly} = props

    const clientConfig = useAppSelector<ClientConfig>(getClientConfig)

    const formatOptionLabel = (user: any) => {
        let profileImg
        if (imageURLForUser) {
            profileImg = imageURLForUser(user.id)
        }

        return (
            <div className='Person-item'>
                {profileImg && (
                    <img
                        alt='Person-avatar'
                        src={profileImg}
                    />
                )}
                {Utils.getUserDisplayName(user, clientConfig.teammateNameDisplay)}
            </div>
        )
    }

    const boardUsersById = useAppSelector<{[key:string]: IUser}>(getBoardUsers)
    const onChange = useCallback((newValue) => mutator.changePropertyValue(board.id, card, propertyTemplate.id, newValue), [board.id, card, propertyTemplate.id])

    const user = boardUsersById[propertyValue as string]

    if (readOnly) {
        return (
            <div className={`Person ${props.property.valueClassName(true)}`}>
                {user ? formatOptionLabel(user) : propertyValue}
            </div>
        )
    }

    const boardUsers = useAppSelector<IUser[]>(getBoardUsersList)

    return (
        <Select
            options={boardUsers}
            isSearchable={true}
            isClearable={true}
            backspaceRemovesValue={true}
            className={`Person ${props.property.valueClassName(props.readOnly)}`}
            classNamePrefix={'react-select'}
            formatOptionLabel={formatOptionLabel}
            styles={selectStyles}
            placeholder={'Empty'}
            getOptionLabel={(o: IUser) => o.username}
            getOptionValue={(a: IUser) => a.id}
            value={boardUsersById[propertyValue as string] || null}
            onChange={(item, action) => {
                if (action.action === 'select-option') {
                    onChange(item?.id || '')
                } else if (action.action === 'clear') {
                    onChange('')
                }
            }}
        />
    )
}

export default Person
