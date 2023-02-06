// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React  from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import mutator from '../../../../webapp/src/mutator'
import {Utils} from '../../../../webapp/src/utils'
import {getCurrentTeam} from '../../../../webapp/src/store/teams'
import {createBoard, Board} from '../../../../webapp/src/blocks/board'
import {useAppSelector} from '../../../../webapp/src/store/hooks'
import IconButton from '../../../../webapp/src/widgets/buttons/iconButton'
import OptionsIcon from '../../../../webapp/src/widgets/icons/options'
import Menu from '../../../../webapp/src/widgets/menu'
import MenuWrapper from '../../../../webapp/src/widgets/menuWrapper'
import {SuiteWindow} from '../../../../webapp/src/types/index'
import CompassIcon from '../../../../webapp/src/widgets/icons/compassIcon'

import {Permission} from '../../../../webapp/src/constants'

import BoardPermissionGate from '../../../../webapp/src/components/permissions/boardPermissionGate'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../../../webapp/src/telemetry/telemetryClient'

import './rhsChannelBoardItem.scss'

const windowAny = (window as SuiteWindow)

type Props = {
    board: Board
}

const RHSChannelBoardItem = (props: Props) => {
    const intl = useIntl()
    const board = props.board

    const team = useAppSelector(getCurrentTeam)
    if (!team) {
        return null
    }

    const handleBoardClicked = (boardID: string) => {
        // send the telemetry information for the clicked board
        const extraData = {teamID: team.id, board: boardID}
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ClickChannelsRHSBoard, extraData)

        window.open(`${windowAny.frontendBaseURL}/team/${team.id}/${boardID}`, '_blank', 'noopener')
    }

    const onUnlinkBoard = async (board: Board) => {
        const newBoard = createBoard(board)
        newBoard.channelId = ''
        mutator.updateBoard(newBoard, board, 'unlinked channel')
    }

    const untitledBoardTitle = intl.formatMessage({id: 'ViewTitle.untitled-board', defaultMessage: 'Untitled board'})

    const markdownHtml = Utils.htmlFromMarkdown(board.description)
    return (
        <div
            onClick={() => handleBoardClicked(board.id)}
            className='RHSChannelBoardItem'
        >
            <div className='board-info'>
                {board.icon && <span className='icon'>{board.icon}</span>}
                <span className='title'>{board.title || untitledBoardTitle}</span>
                <MenuWrapper stopPropagationOnToggle={true}>
                    <IconButton icon={<OptionsIcon/>}/>
                    <Menu
                        position='left'
                    >
                        <BoardPermissionGate
                            boardId={board.id}
                            teamId={team.id}
                            permissions={[Permission.ManageBoardRoles]}
                        >
                            <Menu.Text
                                key={`unlinkBoard-${board.id}`}
                                id='unlinkBoard'
                                name={intl.formatMessage({id: 'rhs-boards.unlink-board', defaultMessage: 'Unlink board'})}
                                icon={<CompassIcon icon='link-variant-off'/>}
                                onClick={() => {
                                    onUnlinkBoard(board)
                                }}
                            />
                        </BoardPermissionGate>
                        <BoardPermissionGate
                            boardId={board.id}
                            teamId={team.id}
                            permissions={[Permission.ManageBoardRoles]}
                            invert={true}
                        >
                            <Menu.Text
                                key={`unlinkBoard-${board.id}`}
                                id='unlinkBoard'
                                disabled={true}
                                name={intl.formatMessage({id: 'rhs-boards.unlink-board1', defaultMessage: 'Unlink board'})}
                                icon={<CompassIcon icon='link-variant-off'/>}
                                onClick={() => {
                                    onUnlinkBoard(board)
                                }}
                                subText={intl.formatMessage({id: 'rhs-board-non-admin-msg', defaultMessage:'You are not an admin of the board'})}
                            />
                        </BoardPermissionGate>
                    </Menu>
                </MenuWrapper>
            </div>
            <div className='description'
                dangerouslySetInnerHTML={{__html: markdownHtml}}
            />
            <div className='date'>
                <FormattedMessage
                    id='rhs-boards.last-update-at'
                    defaultMessage='Last update at: {datetime}'
                    values={{datetime: Utils.displayDateTime(new Date(board.updateAt), intl as any)}}
                />
            </div>
        </div>
    )
}

export default RHSChannelBoardItem
