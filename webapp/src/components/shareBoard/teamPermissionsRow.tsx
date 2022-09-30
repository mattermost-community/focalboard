// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {useIntl} from 'react-intl'

import MenuWrapper from '../../widgets/menuWrapper'
import Menu from '../../widgets/menu'

import CheckIcon from '../../widgets/icons/check'
import CompassIcon from '../../widgets/icons/compassIcon'

import {Board, createBoard, BoardTypeOpen, BoardTypePrivate, MemberRole} from '../../blocks/board'
import {useAppSelector} from '../../store/hooks'
import {getCurrentTeam} from '../../store/teams'
import {getCurrentBoard} from '../../store/boards'
import {Permission} from '../../constants'
import {Utils} from '../../utils'

import BoardPermissionGate from '../permissions/boardPermissionGate'

import mutator from '../../mutator'

function updateBoardType(board: Board, newType: string, newMinimumRole: MemberRole) {
    if (board.type === newType && board.minimumRole === newMinimumRole) {
        return
    }

    const newBoard = createBoard(board)
    newBoard.type = newType
    newBoard.minimumRole = newMinimumRole

    mutator.updateBoard(newBoard, board, 'update board type')
}

const TeamPermissionsRow = (): JSX.Element => {
    const intl = useIntl()
    const team = useAppSelector(getCurrentTeam)
    const board = useAppSelector(getCurrentBoard)

    let currentRoleName = intl.formatMessage({id: 'BoardMember.schemeNone', defaultMessage: 'None'})
    if (board.type === BoardTypeOpen && board.minimumRole === MemberRole.Admin) {
        currentRoleName = intl.formatMessage({id: 'BoardMember.schemeAdmin', defaultMessage: 'Admin'})
    } else if (board.type === BoardTypeOpen && board.minimumRole === MemberRole.Editor) {
        if (board.isTemplate) {
            currentRoleName = intl.formatMessage({id: 'BoardMember.schemeViewer', defaultMessage: 'Viewer'})
        } else {
            currentRoleName = intl.formatMessage({id: 'BoardMember.schemeEditor', defaultMessage: 'Editor'})
        }
    } else if (board.type === BoardTypeOpen && board.minimumRole === MemberRole.Commenter) {
        currentRoleName = intl.formatMessage({id: 'BoardMember.schemeCommenter', defaultMessage: 'Commenter'})
    } else if (board.type === BoardTypeOpen && board.minimumRole === MemberRole.Viewer) {
        currentRoleName = intl.formatMessage({id: 'BoardMember.schemeViewer', defaultMessage: 'Viewer'})
    }

    return (
        <div className='user-item'>
            <div className='user-item__content'>
                {Utils.isFocalboardPlugin() &&
                    <CompassIcon
                        icon='mattermost'
                        className='user-item__img'
                    />
                }
                <div className='ml-3'><strong>{intl.formatMessage({id: 'ShareBoard.teamPermissionsText', defaultMessage: 'Everyone at {teamName} Team'}, {teamName: team?.title})}</strong></div>
            </div>
            <div>
                <BoardPermissionGate permissions={[Permission.ManageBoardType]}>
                    <MenuWrapper>
                        <button className='user-item__button'>
                            {currentRoleName}
                            <CompassIcon
                                icon='chevron-down'
                                className='CompassIcon'
                            />
                        </button>
                        <Menu position='left'>
                            {!board.isTemplate &&
                                <Menu.Text
                                    id={MemberRole.Editor}
                                    check={board.minimumRole === undefined || board.minimumRole === MemberRole.Editor}
                                    icon={board.type === BoardTypeOpen && board.minimumRole === MemberRole.Editor ? <CheckIcon/> : <div className='empty-icon'/>}
                                    name={intl.formatMessage({id: 'BoardMember.schemeEditor', defaultMessage: 'Editor'})}
                                    onClick={() => updateBoardType(board, BoardTypeOpen, MemberRole.Editor)}
                                />}
                            {!board.isTemplate &&
                                <Menu.Text
                                    id={MemberRole.Commenter}
                                    check={board.minimumRole === MemberRole.Commenter}
                                    icon={board.type === BoardTypeOpen && board.minimumRole === MemberRole.Commenter ? <CheckIcon/> : <div className='empty-icon'/>}
                                    name={intl.formatMessage({id: 'BoardMember.schemeCommenter', defaultMessage: 'Commenter'})}
                                    onClick={() => updateBoardType(board, BoardTypeOpen, MemberRole.Commenter)}
                                />}
                            <Menu.Text
                                id={MemberRole.Viewer}
                                check={board.minimumRole === MemberRole.Viewer}
                                icon={board.type === BoardTypeOpen && board.minimumRole === MemberRole.Viewer ? <CheckIcon/> : <div className='empty-icon'/>}
                                name={intl.formatMessage({id: 'BoardMember.schemeViewer', defaultMessage: 'Viewer'})}
                                onClick={() => updateBoardType(board, BoardTypeOpen, MemberRole.Viewer)}
                            />
                            <Menu.Text
                                id={MemberRole.None}
                                check={true}
                                icon={board.type === BoardTypePrivate ? <CheckIcon/> : <div className='empty-icon'/>}
                                name={intl.formatMessage({id: 'BoardMember.schemeNone', defaultMessage: 'None'})}
                                onClick={() => updateBoardType(board, BoardTypePrivate, MemberRole.None)}
                            />
                        </Menu>
                    </MenuWrapper>
                </BoardPermissionGate>
                <BoardPermissionGate
                    permissions={[Permission.ManageBoardType]}
                    invert={true}
                >
                    <span>{currentRoleName}</span>
                </BoardPermissionGate>
            </div>
        </div>
    )
}

export default TeamPermissionsRow
