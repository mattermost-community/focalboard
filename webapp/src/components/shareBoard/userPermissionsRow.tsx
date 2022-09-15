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
import GuestBadge from '../../widgets/guestBadge'
import {useAppSelector} from '../../store/hooks'
import {getCurrentBoard} from '../../store/boards'

import BoardPermissionGate from '../permissions/boardPermissionGate'

type Props = {
    user: IUser
    member: BoardMember
    isMe: boolean
    teammateNameDisplay: string
    onDeleteBoardMember: (member: BoardMember) => void
    onUpdateBoardMember: (member: BoardMember, permission: string) => void
}

const UserPermissionsRow = (props: Props): JSX.Element => {
    const intl = useIntl()
    const board = useAppSelector(getCurrentBoard)
    const {user, member, isMe, teammateNameDisplay} = props
    let currentRole = 'Viewer'
    if (member.schemeAdmin) {
        currentRole = 'Admin'
    } else if (member.schemeEditor || member.minimumRole === 'editor') {
        currentRole = 'Editor'
    } else if (member.schemeCommenter || member.minimumRole === 'commenter') {
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
                    <strong>{Utils.getUserDisplayName(user, teammateNameDisplay)}</strong>
                    <strong className='ml-2 text-light'>{`@${user.username}`}</strong>
                    {isMe && <strong className='ml-2 text-light'>{intl.formatMessage({id: 'ShareBoard.userPermissionsYouText', defaultMessage: '(You)'})}</strong>}
                    <GuestBadge show={user.is_guest}/>
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
                            {(board.minimumRole === 'viewer' || board.minimumRole === '') &&
                                <Menu.Text
                                    id='Viewer'
                                    check={true}
                                    icon={currentRole === 'Viewer' ? <CheckIcon/> : null}
                                    name={intl.formatMessage({id: 'BoardMember.schemeViewer', defaultMessage: 'Viewer'})}
                                    onClick={() => props.onUpdateBoardMember(member, 'Viewer')}
                                />}
                            {!board.isTemplate && (board.minimumRole === '' || board.minimumRole === 'commenter' || board.minimumRole === 'viewer') &&
                                <Menu.Text
                                    id='Commenter'
                                    check={true}
                                    icon={currentRole === 'Commenter' ? <CheckIcon/> : <div className='empty-icon'/>}
                                    name={intl.formatMessage({id: 'BoardMember.schemeCommenter', defaultMessage: 'Commenter'})}
                                    onClick={() => props.onUpdateBoardMember(member, 'Commenter')}
                                />}
                            <Menu.Text
                                id='Editor'
                                check={true}
                                icon={currentRole === 'Editor' ? <CheckIcon/> : <div className='empty-icon'/>}
                                name={intl.formatMessage({id: 'BoardMember.schemeEditor', defaultMessage: 'Editor'})}
                                onClick={() => props.onUpdateBoardMember(member, 'Editor')}
                            />
                            {user.is_guest !== true &&
                                <Menu.Text
                                    id='Admin'
                                    check={true}
                                    icon={currentRole === 'Admin' ? <CheckIcon/> : <div className='empty-icon'/>}
                                    name={intl.formatMessage({id: 'BoardMember.schemeAdmin', defaultMessage: 'Admin'})}
                                    onClick={() => props.onUpdateBoardMember(member, 'Admin')}
                                />}
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
