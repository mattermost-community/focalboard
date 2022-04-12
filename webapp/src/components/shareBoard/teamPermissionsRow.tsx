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

import BoardPermissionGate from '../permissions/boardPermissionGate'

import mutator from '../../mutator'

function updateBoardType(board: Board, newType: string) {
    if (board.type === newType) {
        return
    }

    const newBoard = createBoard(board)
    newBoard.type = newType

    mutator.updateBoard(newBoard, board, 'update board type')
}

const TeamPermissionsRow = (): JSX.Element => {
    const intl = useIntl()
    const team = useAppSelector(getCurrentTeam)
    const board = useAppSelector(getCurrentBoard)

    const currentRole = board.type === BoardTypeOpen ? 'Editor' : 'None'

    return (
        <div className='user-item'>
            <div className='user-item__content'>
                <CompassIcon
                    icon='mattermost'
                    className='user-item__img'
                />
                <div className='ml-3'><strong>{intl.formatMessage({id: 'ShareBoard.teamPermissionsText', defaultMessage: 'Everyone at {teamName} Team'}, {teamName: team?.title})}</strong></div>
            </div>
            <div>
                <BoardPermissionGate permissions={[Permission.ManageBoardType]}>
                    <MenuWrapper>
                        <button className='user-item__button'>
                            {currentRole}
                            <CompassIcon
                                icon='chevron-down'
                                className='CompassIcon'
                            />
                        </button>
                        <Menu position='left'>
                            <Menu.Text
                                id='Editor'
                                check={true}
                                icon={currentRole === 'Editor' ? <CheckIcon/> : null}
                                name={intl.formatMessage({id: 'BoardMember.schemeEditor', defaultMessage: 'Editor'})}
                                onClick={() => updateBoardType(board, BoardTypeOpen)}
                            />
                            <Menu.Text
                                id='None'
                                check={true}
                                icon={currentRole === 'None' ? <CheckIcon/> : null}
                                name={intl.formatMessage({id: 'BoardMember.schemeNone', defaultMessage: 'None'})}
                                onClick={() => updateBoardType(board, BoardTypePrivate)}
                            />
                        </Menu>
                    </MenuWrapper>
                </BoardPermissionGate>
                <BoardPermissionGate
                    permissions={[Permission.ManageBoardType]}
                    invert={true}
                >
                    <span>{currentRole}</span>
                </BoardPermissionGate>
            </div>
        </div>
    )
}

export default TeamPermissionsRow
