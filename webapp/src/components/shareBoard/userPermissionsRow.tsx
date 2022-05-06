// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {useIntl, FormattedMessage} from 'react-intl'

import MenuWrapper from '../../widgets/menuWrapper'
import Menu from '../../widgets/menu'

import CheckIcon from '../../widgets/icons/check'
import CompassIcon from '../../widgets/icons/compassIcon'

import {BoardMember} from '../../blocks/board'
import {IUser} from '../../user'
import {Utils} from '../../utils'
import {Permission} from '../../constants'

import BoardPermissionGate from '../permissions/boardPermissionGate'

type Props = {
    user: IUser
    member: BoardMember
    isMe: boolean
    onDeleteBoardMember: (member: BoardMember) => void
    onUpdateBoardMember: (member: BoardMember, permission: string) => void
}

const UserPermissionsRow = (props: Props): JSX.Element => {
    const intl = useIntl()
    const {user, member, isMe} = props
    let currentRole = 'Viewer'
    if (member.schemeAdmin) {
        currentRole = 'Admin'
    } else if (member.schemeEditor) {
        currentRole = 'Editor'
    } else if (member.schemeCommenter) {
        currentRole = 'Commenter'
    }

    return (
        <div className='user-item'>
            <div className='user-item__content'>
                {Utils.isFocalboardPlugin() &&
                    <img
                        src={Utils.getProfilePicture(user.id)}
                        className='user-item__img'
                    />
                }
                <div className='ml-3'>
                    <strong>{user.username}</strong>
                    <strong className='ml-2 text-light'>{`@${user.username}`}</strong>
                    {isMe && <strong className='ml-2 text-light'>{intl.formatMessage({id: 'ShareBoard.userPermissionsYouText', defaultMessage: '(You)'})}</strong>}
                </div>
            </div>
            <div>
                <BoardPermissionGate permissions={[Permission.ManageBoardRoles]}>
                    <MenuWrapper>
                        <button className='user-item__button'>
                            {intl.formatMessage({id: `BoardMember.scheme${currentRole}`, defaultMessage: currentRole})}
                            <CompassIcon
                                icon='chevron-down'
                                className='CompassIcon'
                            />
                        </button>
                        <Menu position='left'>
                            <Menu.Text
                                id='Viewer'
                                check={true}
                                icon={currentRole === 'Viewer' ? <CheckIcon/> : null}
                                name={intl.formatMessage({id: 'BoardMember.schemeViewer', defaultMessage: 'Viewer'})}
                                onClick={() => props.onUpdateBoardMember(member, 'Viewer')}
                            />
                            <Menu.Text
                                id='Editor'
                                check={true}
                                icon={currentRole === 'Editor' ? <CheckIcon/> : null}
                                name={intl.formatMessage({id: 'BoardMember.schemeEditor', defaultMessage: 'Editor'})}
                                onClick={() => props.onUpdateBoardMember(member, 'Editor')}
                            />
                            <Menu.Text
                                id='Admin'
                                check={true}
                                icon={currentRole === 'Admin' ? <CheckIcon/> : null}
                                name={intl.formatMessage({id: 'BoardMember.schemeAdmin', defaultMessage: 'Admin'})}
                                onClick={() => props.onUpdateBoardMember(member, 'Admin')}
                            />
                            <Menu.Separator/>
                            <Menu.Text
                                id='Remove'
                                name={intl.formatMessage({id: 'ShareBoard.userPermissionsRemoveMemberText', defaultMessage: 'Remove member'})}
                                onClick={() => props.onDeleteBoardMember(member)}
                            />
                        </Menu>
                    </MenuWrapper>
                </BoardPermissionGate>
                <BoardPermissionGate
                    permissions={[Permission.ManageBoardRoles]}
                    invert={true}
                >
                    <FormattedMessage
                        id={`BoardMember.scheme${currentRole}`}
                        defaultMessage={currentRole}
                    />
                </BoardPermissionGate>
            </div>
        </div>
    )
}

export default UserPermissionsRow
