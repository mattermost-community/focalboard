// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {useIntl} from 'react-intl'

import MenuWrapper from '../../widgets/menuWrapper'
import Menu from '../../widgets/menu'

import CheckIcon from '../../widgets/icons/check'
import CompassIcon from '../../widgets/icons/compassIcon'

import {Board, BoardMember, BoardTypeOpen, BoardTypePrivate} from '../../blocks/board'
import {IUser} from '../../user'

import {useAppSelector} from '../../store/hooks'
import {getCurrentBoard} from '../../store/boards'

import mutator from '../../mutator'


function updateBoardMember(member: BoardMember, newPermission: string) {
    const newMember = {
        boardId: member.boardId,
        userId: member.userId,
        roles: member.roles,
    } as BoardMember

    switch(newPermission) {
        case 'Admin':
            if (member.schemeAdmin) {
                return
            }
            newMember.schemeAdmin = true
            newMember.schemeEditor = true
            break
        case 'Editor':
            if (member.schemeEditor) {
                return
            }
            newMember.schemeEditor = true
            break
        default:
            return
    }

    mutator.updateBoardMember(newMember, member)
}

function deleteBoardMember(member: BoardMember) {
    mutator.deleteBoardMember(member)
}

type Props = {
    user: IUser
    member: BoardMember
    isMe: Boolean
}

const UserPermissionsRow = ({user, member, isMe}: Props): JSX.Element => {
    const intl = useIntl()
    const board = useAppSelector(getCurrentBoard)

    const currentRole = member.schemeAdmin ? 'Admin' : 'Editor'

    return (
        <div className='user-item'>
            <div className='user-item__content'>
                {/* ToDo: update to use Utils.getProfilePicture(user.id) after merge with main */}
                <img
                    src='https://randomuser.me/api/portraits/men/75.jpg'
                    className='user-item__img'
                />
                <div className='ml-3'>
                    <strong>{user.username}</strong>
                    <strong className='ml-2 text-light'>{`@${user.username}`}</strong>
                    {isMe && <strong className='ml-2 text-light'>{intl.formatMessage({id: 'ShareBoard.userPermissionsYouText', defaultMessage: '(You)'})}</strong>}
                </div>
            </div>
            <div>
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
                            id='Editor'
                            icon={'Editor' === currentRole ? <CheckIcon /> : null}
                            name={intl.formatMessage({id: 'BoardMember.schemeEditor', defaultMessage: 'Editor'})}
                            onClick={() => updateBoardMember(member, 'Editor')}
                        />
                        <Menu.Text
                            id='Admin'
                            icon={'Admin' === currentRole ? <CheckIcon /> : null}
                            name={intl.formatMessage({id: 'BoardMember.schemeAdmin', defaultMessage: 'Admin'})}
                            onClick={() => updateBoardMember(member, 'Admin')}
                        />
                        <Menu.Separator />
                        <Menu.Text
                            id='Remove'
                            name={intl.formatMessage({id: 'ShareBoard.userPermissionsRemoveMemberText', defaultMessage: 'Remove member'})}
                            onClick={() => deleteBoardMember(member)}
                        />
                    </Menu>
                </MenuWrapper>
            </div>
        </div>
    )
}

export default UserPermissionsRow
