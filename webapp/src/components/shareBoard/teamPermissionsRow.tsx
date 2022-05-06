// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {useIntl} from 'react-intl'

import MenuWrapper from '../../widgets/menuWrapper'
import Menu from '../../widgets/menu'

import CheckIcon from '../../widgets/icons/check'
import CompassIcon from '../../widgets/icons/compassIcon'

import {Board, createBoard, BoardTypeOpen, BoardTypePrivate} from '../../blocks/board'
import {useAppSelector} from '../../store/hooks'
import {getCurrentTeam} from '../../store/teams'
import {getCurrentBoard} from '../../store/boards'
import {Permission} from '../../constants'
import {Utils} from '../../utils'

import BoardPermissionGate from '../permissions/boardPermissionGate'

import mutator from '../../mutator'

function updateBoardType(board: Board, newType: string, newMinimumRole: string) {
    if (board.type === newType && board.minimumRole == newMinimumRole) {
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
    if (board.type === BoardTypeOpen && board.minimumRole === 'admin') {
        currentRoleName = intl.formatMessage({id: 'BoardMember.schemeAdmin', defaultMessage: 'Admin'})
    }else if (board.type === BoardTypeOpen && board.minimumRole === 'editor') {
        currentRoleName = intl.formatMessage({id: 'BoardMember.schemeEditor', defaultMessage: 'Editor'})
    }else if (board.type === BoardTypeOpen && board.minimumRole === 'commenter') {
        currentRoleName = intl.formatMessage({id: 'BoardMember.schemeCommenter', defaultMessage: 'Commenter'})
    }else if (board.type === BoardTypeOpen && board.minimumRole === 'viewer') {
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
                            <Menu.Text
                                id='Admin'
                                check={board.minimumRole === 'admin'}
                                icon={board.type === BoardTypeOpen && board.minimumRole === 'admin' ? <CheckIcon/> : null}
                                name={intl.formatMessage({id: 'BoardMember.schemeAdmin', defaultMessage: 'Admin'})}
                                onClick={() => updateBoardType(board, BoardTypeOpen, 'admin')}
                            />
                            <Menu.Text
                                id='Editor'
                                check={board.minimumRole === '' || board.minimumRole === 'editor' }
                                icon={board.type === BoardTypeOpen && board.minimumRole === 'editor' ? <CheckIcon/> : null}
                                name={intl.formatMessage({id: 'BoardMember.schemeEditor', defaultMessage: 'Editor'})}
                                onClick={() => updateBoardType(board, BoardTypeOpen, 'editor')}
                            />
                            <Menu.Text
                                id='Commenter'
                                check={board.minimumRole === 'commenter'}
                                icon={board.type === BoardTypeOpen && board.minimumRole === 'commenter' ? <CheckIcon/> : null}
                                name={intl.formatMessage({id: 'BoardMember.schemeCommenter', defaultMessage: 'Commenter'})}
                                onClick={() => updateBoardType(board, BoardTypeOpen, 'commenter')}
                            />
                            <Menu.Text
                                id='Viewer'
                                check={board.minimumRole === 'viewer'}
                                icon={board.type === BoardTypeOpen && board.minimumRole === 'viewer' ? <CheckIcon/> : null}
                                name={intl.formatMessage({id: 'BoardMember.schemeViwer', defaultMessage: 'Viewer'})}
                                onClick={() => updateBoardType(board, BoardTypeOpen, 'viewer')}
                            />
                            <Menu.Text
                                id='None'
                                check={true}
                                icon={board.type === BoardTypePrivate ? <CheckIcon/> : null}
                                name={intl.formatMessage({id: 'BoardMember.schemeNone', defaultMessage: 'None'})}
                                onClick={() => updateBoardType(board, BoardTypePrivate, 'editor')}
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
