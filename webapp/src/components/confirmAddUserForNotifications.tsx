// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, useRef} from 'react'
import Select from 'react-select'
import {useIntl} from 'react-intl'

import {IUser} from '../user'
import ConfirmationDialog from './confirmationDialogBox'

type Props = {
    user: IUser,
    onConfirm: (userId: string, role: string) => void
    onClose: () => void
}

const ConfirmAddUserForNotifications = (props: Props): JSX.Element => {
    const {user} = props
    const [newUserRole, setNewUserRole] = useState('Editor')
    const userRole = useRef<string>('Editor')

    const intl = useIntl()

    const roleOptions = [
        {id: 'Admin', label: intl.formatMessage({id:'PersonProperty.add-user-admin-role', defaultMessage:'Admin'})},
        {id: 'Editor', label: intl.formatMessage({id:'PersonProperty.add-user-editor-role', defaultMessage:'Editor'})},
        {id: 'Commenter', label: intl.formatMessage({id:'PersonProperty.add-user-commenter-role', defaultMessage:'Commenter'})},
        {id: 'Viewer', label: intl.formatMessage({id:'PersonProperty.add-user-viewer-role', defaultMessage:'Viewer'})},
    ]
    const roleSelector = (
        <Select
            getOptionLabel={(o: {id: string, label: string}) => o.label}
            getOptionValue={(o: {id: string, label: string}) => o.id}
            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            menuPortalTarget={document.body}
            options={roleOptions}
            onChange={(option) => {
                setNewUserRole(option?.id || 'Editor')
                userRole.current = option?.id || 'Editor'
            }}
            value={roleOptions.find((o) => o.id === newUserRole)}
        />
    )

    return (
        <ConfirmationDialog
            dialogBox={{
                heading: intl.formatMessage({id: 'person.add-user-to-board', defaultMessage: 'Add {username} to board'}, {username: props.user.username}),
                subText: intl.formatMessage({id: 'person.add-user-to-board-question', defaultMessage: '{username} is not a member of the board, and will not received any notifications about it.{lineBreak}Do you want to add {username} to the board?{lineBreak}{roleSelector}'}, {lineBreak: <p/>, username: props.user.username, roleSelector}),
                confirmButtonText: intl.formatMessage({id: 'person.add-user-to-board-confirm-button', defaultMessage: 'Add to board'}),
                onConfirm: () => props.onConfirm(user.id, userRole.current),
                onClose: props.onClose,
            }}
        />
    )
}

export default ConfirmAddUserForNotifications
