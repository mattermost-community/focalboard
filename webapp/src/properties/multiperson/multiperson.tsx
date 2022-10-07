// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useState} from 'react'
import {useIntl} from 'react-intl'
import Select from 'react-select/async'
import {CSSObject} from '@emotion/serialize'

import {getSelectBaseStyle} from '../../theme'
import {IUser} from '../../user'
import {Utils} from '../../utils'
import mutator from '../../mutator'
import {useAppSelector} from '../../store/hooks'
import {getBoardUsers, getBoardUsersList} from '../../store/users'
import {BoardMember, BoardTypeOpen, MemberRole} from '../../blocks/board'

import {PropertyProps} from '../types'
import {ClientConfig} from '../../config/clientConfig'
import {getClientConfig} from '../../store/clientConfig'
import {useHasPermissions} from '../../hooks/permissions'
import {Permission} from '../../constants'
import client from '../../octoClient'
import ConfirmAddUserForNotifications from '../../components/confirmAddUserForNotifications'
import GuestBadge from '../../widgets/guestBadge'

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

const MultiPerson = (props: PropertyProps): JSX.Element => {
    const {card, board, propertyTemplate, propertyValue, readOnly} = props
    const [confirmAddUser, setConfirmAddUser] = useState<IUser|null>(null)

    const clientConfig = useAppSelector<ClientConfig>(getClientConfig)
    const intl = useIntl()

    const boardUsersById = useAppSelector<{[key: string]: IUser}>(getBoardUsers)
    const boardUsers = useAppSelector<IUser[]>(getBoardUsersList)
    const boardUsersKey = Object.keys(boardUsersById) ? Utils.hashCode(JSON.stringify(Object.keys(boardUsersById))) : 0

    const allowManageBoardRoles = useHasPermissions(board.teamId, board.id, [Permission.ManageBoardRoles])
    const allowAddUsers = allowManageBoardRoles || board.type === BoardTypeOpen

    const onChange = useCallback((newValue) => mutator.changePropertyValue(board.id, card, propertyTemplate.id, newValue), [board.id, card, propertyTemplate.id])

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
                className='MultiPerson-item'
            >
                {profileImg && (
                    <img
                        alt='MultiPerson-avatar'
                        src={profileImg}
                    />
                )}
                {Utils.getUserDisplayName(user, clientConfig.teammateNameDisplay)}
                <GuestBadge show={Boolean(user?.is_guest)}/>
            </div>
        )
    }

    let users: IUser[] = []

    if (typeof propertyValue === 'string' && propertyValue !== '') {
        users = [boardUsersById[propertyValue as string]]
    } else if (Array.isArray(propertyValue) && propertyValue.length > 0) {
        users = propertyValue.map((id) => boardUsersById[id])
    }

    const addUser = useCallback(async (userId: string, role: string) => {
        const newRole = role || MemberRole.Viewer
        const newMember = {
            boardId: board.id,
            userId,
            roles: role,
            schemeAdmin: newRole === MemberRole.Admin,
            schemeEditor: newRole === MemberRole.Admin || newRole === MemberRole.Editor,
            schemeCommenter: newRole === MemberRole.Admin || newRole === MemberRole.Editor || newRole === MemberRole.Commenter,
            schemeViewer: newRole === MemberRole.Admin || newRole === MemberRole.Editor || newRole === MemberRole.Commenter || newRole === MemberRole.Viewer,
        } as BoardMember

        setConfirmAddUser(null)
        await mutator.createBoardMember(newMember)

        if (users) {
            const userIds = users.map((a) => a.id)
            await mutator.changePropertyValue(board.id, card, propertyTemplate.id, [...userIds, newMember.userId])
        } else {
            await mutator.changePropertyValue(board.id, card, propertyTemplate.id, newMember.userId)
        }
    }, [board, card, propertyTemplate, users])

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

    if (readOnly) {
        return (
            <div className={`MultiPerson ${props.property.valueClassName(true)}`}>
                {users ? users.map((user) => formatOptionLabel(user)) : propertyValue}
            </div>
        )
    }

    return (
        <>
            {confirmAddUser &&
                <ConfirmAddUserForNotifications
                    allowManageBoardRoles={allowManageBoardRoles}
                    minimumRole={board.minimumRole}
                    user={confirmAddUser}
                    onConfirm={addUser}
                    onClose={() => setConfirmAddUser(null)}
                />}
            <Select
                key={boardUsersKey}
                loadOptions={loadOptions}
                isMulti={true}
                defaultOptions={true}
                isSearchable={true}
                isClearable={true}
                backspaceRemovesValue={true}
                className={`MultiPerson ${props.property.valueClassName(props.readOnly)}`}
                classNamePrefix={'react-select'}
                formatOptionLabel={formatOptionLabel}
                styles={selectStyles}
                placeholder={'Empty'}
                getOptionLabel={(o: IUser) => o.username}
                getOptionValue={(a: IUser) => a.id}
                value={users}
                onChange={(items, action) => {
                    if (action.action === 'select-option') {
                        const confirmedIds: string[] = []
                        items.forEach((item) => {
                            if (boardUsersById[item.id]) {
                                confirmedIds.push(item.id)
                            } else {
                                setConfirmAddUser(item)
                            }
                        })
                        onChange(confirmedIds)
                    } else if (action.action === 'clear') {
                        onChange([])
                    } else if (action.action === 'remove-value') {
                        onChange(items.filter((a) => a.id !== action.removedValue.id).map((b) => b.id) || [])
                    }
                }}
            />
        </>
    )
}

export default MultiPerson
