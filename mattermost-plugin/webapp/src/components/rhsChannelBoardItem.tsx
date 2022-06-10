// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React  from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import mutator from '../../../../webapp/src/mutator'
import {Utils} from '../../../../webapp/src/utils'
import {getCurrentTeam, getAllTeams, Team} from '../../../../webapp/src/store/teams'
import {createBoard, Board} from '../../../../webapp/src/blocks/board'
import {useAppSelector} from '../../../../webapp/src/store/hooks'
import IconButton from '../../../../webapp/src/widgets/buttons/iconButton'
import OptionsIcon from '../../../../webapp/src/widgets/icons/options'
import DeleteIcon from '../../../../webapp/src/widgets/icons/delete'
import Menu from '../../../../webapp/src/widgets/menu'
import MenuWrapper from '../../../../webapp/src/widgets/menuWrapper'


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
        const windowAny: any = window
        windowAny.WebappUtils.browserHistory.push(`/boards/team/${team.id}/${boardID}`)
    }

    const onUnlinkBoard = async (board: Board) => {
        const newBoard = createBoard(board)
        newBoard.channelId = ''
        mutator.updateBoard(newBoard, board, 'unlinked channel')
    }

    return (
        <div
            onClick={() => handleBoardClicked(board.id)}
            style={{padding: 15, textAlign: 'left', border: '1px solid #cccccc', borderRadius: 5, marginTop: 10, cursor: 'pointer'}}
        >
            <div style={{fontSize: 16, display: 'flex'}}>
                {board.icon && <span style={{marginRight: 10}}>{board.icon}</span>}
                <span style={{fontWeight: 600, flexGrow: 1}}>{board.title}</span>
                <MenuWrapper stopPropagationOnToggle={true}>
                    <IconButton icon={<OptionsIcon/>}/>
                    <Menu
                        fixed={true}
                        position='left'
                    >
                        {/* TODO: Translate this later */}
                        <Menu.Text
                            key={`unlinkBoard-${board.id}`}
                            id='unlinkBoard'
                            name={intl.formatMessage({id: 'rhs-boards.unlink-board', defaultMessage: 'Unlink Board'})}
                            icon={<DeleteIcon/>}
                            onClick={() => {
                                onUnlinkBoard(board)
                            }}
                        />
                    </Menu>
                </MenuWrapper>
            </div>
            <div>{board.description}</div>
            <div style={{color: '#cccccc'}}>
                <FormattedMessage
                    id='rhs-boards.last-update-at'
                    defaultMessage='Last Update at: {datetime}'
                    values={{datetime: Utils.displayDateTime(new Date(board.updateAt), intl)}}
                />
            </div>
        </div>
    )
}

export default RHSChannelBoardItem
