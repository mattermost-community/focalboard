// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useState} from 'react'
import Select from 'react-select/async'
import {useIntl} from 'react-intl'
import {CSSObject} from '@emotion/serialize'

import {Utils} from '../../utils'
import {IUser} from '../../user'
import {getBoardUsersList, getBoardUsers} from '../../store/users'
import {BoardMember, BoardTypeOpen, MemberRole} from '../../blocks/board'
import {useAppSelector} from '../../store/hooks'
import mutator from '../../mutator'
import {getSelectBaseStyle} from '../../theme'
import {ClientConfig} from '../../config/clientConfig'
import {getClientConfig} from '../../store/clientConfig'
import {useHasPermissions} from '../../hooks/permissions'
import {Permission} from '../../constants'
import client from '../../octoClient'
import ConfirmAddUserForNotifications from '../../components/confirmAddUserForNotifications'
import GuestBadge from '../../widgets/guestBadge'

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
    const [confirmAddUser, setConfirmAddUser] = useState<IUser|null>(null)

    const boardUsers = useAppSelector<IUser[]>(getBoardUsersList)
    const boardUsersById = useAppSelector<{[key: string]: IUser}>(getBoardUsers)
    const boardUsersKey = Object.keys(boardUsersById) ? Utils.hashCode(JSON.stringify(Object.keys(boardUsersById))) : 0
    const onChange = useCallback((newValue) => mutator.changePropertyValue(board.id, card, propertyTemplate.id, newValue), [board.id, card, propertyTemplate.id])

    const me: IUser = boardUsersById[propertyValue as string]

    const clientConfig = useAppSelector<ClientConfig>(getClientConfig)
    const intl = useIntl()

    const formatOptionLabel = (user: IUser) => {
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
                <GuestBadge show={Boolean(user?.is_guest)}/>
            </div>
        )
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
        await mutator.changePropertyValue(board.id, card, propertyTemplate.id, newMember.userId)
        mutator.updateBoardMember(newMember, {...newMember, schemeAdmin: false, schemeEditor: true, schemeCommenter: true, schemeViewer: true})
    }, [board, card, propertyTemplate])

    const allowManageBoardRoles = useHasPermissions(board.teamId, board.id, [Permission.ManageBoardRoles])
    const allowAddUsers = allowManageBoardRoles || board.type === BoardTypeOpen

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
            <div className={`Person ${props.property.valueClassName(true)}`}>
                {me ? formatOptionLabel(me) : propertyValue}
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
                defaultOptions={true}
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
                        if (boardUsersById[item?.id || '']) {
                            onChange(item?.id || '')
                        } else {
                            setConfirmAddUser(item)
                        }
                    } else if (action.action === 'clear') {
                        onChange('')
                    }
                }}
            />
        </>
    )
}

export default Person
