// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, useRef} from 'react'
import Select from 'react-select'
import {useIntl, FormattedMessage} from 'react-intl'

import {MemberRole} from '../blocks/board'

import {IUser} from '../user'

import ConfirmationDialog from './confirmationDialogBox'

import './confirmAddUserForNotifications.scss'

type Props = {
    user: IUser
    defaultRole: MemberRole
    allowManageBoardRoles: boolean
    onConfirm: (userId: string, role: string) => void
    onClose: () => void
}

const ConfirmAddUserForNotifications = (props: Props): JSX.Element => {
    const {user, allowManageBoardRoles} = props
    const [newUserRole, setNewUserRole] = useState(props.defaultRole)
    const userRole = useRef<string>(props.defaultRole)

    const intl = useIntl()

    const roleOptions = [
        {id: MemberRole.Admin, label: intl.formatMessage({id: 'BoardMember.schemeAdmin', defaultMessage: 'Admin'})},
        {id: MemberRole.Editor, label: intl.formatMessage({id: 'BoardMember.schemeEditor', defaultMessage: 'Editor'})},
        {id: MemberRole.Commenter, label: intl.formatMessage({id: 'BoardMember.schemeCommenter', defaultMessage: 'Commenter'})},
        {id: MemberRole.Viewer, label: intl.formatMessage({id: 'BoardMember.schemeViewer', defaultMessage: 'Viewer'})},
    ]

    let currentRoleName = intl.formatMessage({id: 'BoardMember.schemeNone', defaultMessage: 'None'})
    if (props.defaultRole === MemberRole.Admin) {
        currentRoleName = intl.formatMessage({id: 'BoardMember.schemeAdmin', defaultMessage: 'Admin'})
    } else if (props.defaultRole === MemberRole.Editor) {
        currentRoleName = intl.formatMessage({id: 'BoardMember.schemeEditor', defaultMessage: 'Editor'})
    } else if (props.defaultRole === MemberRole.Commenter) {
        currentRoleName = intl.formatMessage({id: 'BoardMember.schemeCommenter', defaultMessage: 'Commenter'})
    } else if (props.defaultRole === MemberRole.Viewer) {
        currentRoleName = intl.formatMessage({id: 'BoardMember.schemeViewer', defaultMessage: 'Viewer'})
    }

    const subText = (
        <div className='ConfirmAddUserForNotifications'>
            <p>
                <FormattedMessage
                    id='person.add-user-to-board-warning'
                    defaultMessage='{username} is not a member of the board, and will not received any notifications about it.'
                    values={{username: props.user.username}}
                />
            </p>
            <p>
                <FormattedMessage
                    id='person.add-user-to-board-question'
                    defaultMessage='Do you want to add {username} to the board?'
                    values={{username: props.user.username}}
                />
            </p>
            <div className='permissions-title'>
                <label>
                    <FormattedMessage
                        id='person.add-user-to-board-permissions'
                        defaultMessage='Permissions'
                    />
                </label>
            </div>
            {!allowManageBoardRoles &&
                <label>{currentRoleName}</label>
            }
            {allowManageBoardRoles &&
                <Select
                    className='select'
                    getOptionLabel={(o: {id: string, label: string}) => o.label}
                    getOptionValue={(o: {id: string, label: string}) => o.id}
                    styles={{menuPortal: (base) => ({...base, zIndex: 9999})}}
                    menuPortalTarget={document.body}
                    options={roleOptions}
                    onChange={(option) => {
                        setNewUserRole(option?.id || props.defaultRole)
                        userRole.current = option?.id || props.defaultRole
                    }}
                    value={roleOptions.find((o) => o.id === newUserRole)}
                />
            }
        </div>
    )

    return (
        <ConfirmationDialog
            dialogBox={{
                heading: intl.formatMessage({id: 'person.add-user-to-board', defaultMessage: 'Add {username} to board'}, {username: props.user.username}),
                subText,
                confirmButtonText: intl.formatMessage({id: 'person.add-user-to-board-confirm-button', defaultMessage: 'Add to board'}),
                onConfirm: () => props.onConfirm(user.id, userRole.current),
                onClose: props.onClose,
            }}
        />
    )
}

export default ConfirmAddUserForNotifications
