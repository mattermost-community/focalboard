// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react'
import {useIntl} from 'react-intl'
import Select from 'react-select/async'
import {CSSObject} from '@emotion/serialize'

import {ActionMeta} from 'react-select'

import {getSelectBaseStyle} from '../theme'
import {IUser} from '../user'
import {Utils} from '../utils'
import {useAppSelector} from '../store/hooks'
import {getBoardUsers, getBoardUsersList} from '../store/users'

import {ClientConfig} from '../config/clientConfig'
import {getClientConfig} from '../store/clientConfig'
import client from '../octoClient'

import GuestBadge from '../widgets/guestBadge'
import {PropertyType} from '../properties/types'

import './personSelector.scss'

const imageURLForUser = (window as any).Components?.imageURLForUser

type Props = {
    readOnly: boolean
    userIDs: string[]
    allowAddUsers: boolean
    property?: PropertyType
    emptyDisplayValue: string
    isMulti: boolean
    closeMenuOnSelect?: boolean
    onChange: (items: any, action: ActionMeta<IUser>) => void
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

const PersonSelector = (props: Props): JSX.Element => {
    const {readOnly, userIDs, allowAddUsers, isMulti, closeMenuOnSelect = true, emptyDisplayValue, onChange} = props

    const clientConfig = useAppSelector<ClientConfig>(getClientConfig)
    const intl = useIntl()

    const boardUsersById = useAppSelector<{[key: string]: IUser}>(getBoardUsers)
    const boardUsers = useAppSelector<IUser[]>(getBoardUsersList)
    const boardUsersKey = Object.keys(boardUsersById) ? Utils.hashCode(JSON.stringify(Object.keys(boardUsersById))) : 0

    const formatOptionLabel = (user: any): JSX.Element => {
        if (!user) {
            return <div/>
        }
        let profileImg
        if (imageURLForUser) {
            profileImg = imageURLForUser(user.id)
        }

        return (
            <div
                key={user.id}
                className='Person-item'
            >
                {profileImg && (
                    <img
                        alt='Person-avatar'
                        src={profileImg}
                    />
                )}
                {Utils.getUserDisplayName(user, clientConfig.teammateNameDisplay)}
                <GuestBadge show={Boolean(user?.is_guest)}/>
            </div>
        )
    }

    let users: IUser[] = []
    if (Array.isArray(userIDs) && userIDs.length > 0) {
        users = userIDs.map((id) => boardUsersById[id])
    }

    const loadOptions = useCallback(async (value: string) => {
        if (!allowAddUsers) {
            return boardUsers.filter((u) => u.username.toLowerCase().includes(value.toLowerCase()))
        }
        const excludeBots = true
        const allUsers = await client.searchTeamUsers(value, excludeBots)
        const usersInsideBoard: IUser[] = []
        const usersOutsideBoard: IUser[] = []
        for (const u of allUsers) {
            if (boardUsersById[u.id]) {
                usersInsideBoard.push(u)
            } else {
                usersOutsideBoard.push(u)
            }
        }
        return [
            {label: intl.formatMessage({id: 'PersonProperty.board-members', defaultMessage: 'Board members'}), options: usersInsideBoard},
            {label: intl.formatMessage({id: 'PersonProperty.non-board-members', defaultMessage: 'Not board members'}), options: usersOutsideBoard},
        ]
    }, [boardUsers, allowAddUsers, boardUsersById])

    let secondaryClass = ''
    if (props.property) {
        secondaryClass = ` ${props.property.valueClassName(readOnly)}`
    }

    if (readOnly) {
        return (
            <div className={`Person${secondaryClass}`}>
                {users.map((user) => formatOptionLabel(user))}
            </div>
        )
    }

    return (
        <>
            <Select
                key={boardUsersKey}
                loadOptions={loadOptions}
                isMulti={isMulti}
                defaultOptions={true}
                isSearchable={true}
                isClearable={true}
                backspaceRemovesValue={true}
                closeMenuOnSelect={closeMenuOnSelect}
                // className={`MultiPerson ${props.property.valueClassName(props.readOnly)}`}
                className={`Person${secondaryClass}`}
                classNamePrefix={'react-select'}
                formatOptionLabel={formatOptionLabel}
                styles={selectStyles}
                placeholder={emptyDisplayValue}
                getOptionLabel={(o: IUser) => o.username}
                getOptionValue={(a: IUser) => a.id}
                value={users}
                onChange={onChange}
            />
        </>
    )
}

export default PersonSelector
