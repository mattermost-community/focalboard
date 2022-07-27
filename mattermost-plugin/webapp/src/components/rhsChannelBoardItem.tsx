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
import DeleteIcon from '../../../../webapp/src/widgets/icons/delete'
import Menu from '../../../../webapp/src/widgets/menu'
import MenuWrapper from '../../../../webapp/src/widgets/menuWrapper'
import {SuiteWindow} from '../../../../webapp/src/types/index'

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
        window.open(`${windowAny.frontendBaseURL}/team/${team.id}/${boardID}`, '_blank', 'noopener')
    }

    const onUnlinkBoard = async (board: Board) => {
        const newBoard = createBoard(board)
        newBoard.channelId = ''
        mutator.updateBoard(newBoard, board, 'unlinked channel')
    }

    const untitledBoardTitle = intl.formatMessage({id: 'ViewTitle.untitled-board', defaultMessage: 'Untitled board'})

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
                        fixed={true}
                        position='left'
                    >
                        <Menu.Text
                            key={`unlinkBoard-${board.id}`}
                            id='unlinkBoard'
                            name={intl.formatMessage({id: 'rhs-boards.unlink-board', defaultMessage: 'Unlink board'})}
                            icon={<DeleteIcon/>}
                            onClick={() => {
                                onUnlinkBoard(board)
                            }}
                        />
                    </Menu>
                </MenuWrapper>
            </div>
            <div className='description'>{board.description}</div>
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
