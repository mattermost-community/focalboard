// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, ReactNode} from 'react'
import {Provider as ReduxProvider} from 'react-redux'
import {IntlProvider, useIntl} from 'react-intl'

import {getMessages} from '../../../../webapp/src/i18n'
import {getLanguage} from '../../../../webapp/src/store/language'

import store from '../../../../webapp/src/store'
import octoClient from '../../../../webapp/src/octoClient'
import mutator from '../../../../webapp/src/mutator'
import {getCurrentTeam, getAllTeams, Team} from '../../../../webapp/src/store/teams'
import {getMySortedBoards} from '../../../../webapp/src/store/boards'
import {BoardTypeOpen, BoardTypePrivate, createBoard, Board} from '../../../../webapp/src/blocks/board'
import {useAppSelector} from '../../../../webapp/src/store/hooks'
import AddIcon from '../../../../webapp/src/widgets/icons/add'
import Button from '../../../../webapp/src/widgets/buttons/button'
import IconButton from '../../../../webapp/src/widgets/buttons/iconButton'
import OptionsIcon from '../../../../webapp/src/widgets/icons/options'
import DeleteIcon from '../../../../webapp/src/widgets/icons/delete'
import Globe from '../../../../webapp/src/widgets/icons/globe'
import LockOutline from '../../../../webapp/src/widgets/icons/lockOutline'
import Menu from '../../../../webapp/src/widgets/menu'
import MenuWrapper from '../../../../webapp/src/widgets/menuWrapper'
import SearchDialog from '../../../../webapp/src/components/searchDialog/searchDialog'

import '../../../../webapp/src/styles/focalboard-variables.scss'
import '../../../../webapp/src/styles/main.scss'
import '../../../../webapp/src/styles/labels.scss'

const RHSChannelBoards = (props: {getCurrentChannel: () => string}) => {
    const [searchingChannel, setSearchingChannel] = useState(false)
    const intl = useIntl()
    const boards = useAppSelector(getMySortedBoards)
    const teamsById:Record<string, Team> = {}
    useAppSelector(getAllTeams).forEach((t) => {
        teamsById[t.id] = t
    })
    const team = useAppSelector(getCurrentTeam)
    if (!boards) {
        return null
    }
    if (!team) {
        return null
    }
    const currentChannel = props.getCurrentChannel()
    const channelBoards = boards.filter((b) => b.channelId === currentChannel)
    const handleBoardClicked = (boardID: string) => {
        window.open(`${(window as any).frontendBaseURL}/team/${team.id}/${boardID}`, '_blank', 'noopener')
    }

    const onUnlinkBoard = async (board: Board) => {
        const newBoard = createBoard(board)
        newBoard.channelId = ''
        mutator.updateBoard(newBoard, board, 'unlinked channel')
    }

    const selectBoard = async (board: Board): Promise<void> => {
        const newBoard = createBoard(board)
        newBoard.channelId = props.getCurrentChannel()
        mutator.updateBoard(newBoard, board, 'unlinked channel')
    }

    const searchHandler = async (query: string): Promise<Array<ReactNode>> => {
        if (query.trim().length === 0 || !team) {
            return []
        }

        const items = await octoClient.search(team.id, query)
        const untitledBoardTitle = intl.formatMessage({id: 'ViewTitle.untitled-board', defaultMessage: 'Untitled Board'})
        return items.map((item) => {
            const resultTitle = item.title || untitledBoardTitle
            const teamTitle = teamsById[item.teamId].title
            return (
                <div
                    key={item.id}
                    className='blockSearchResult'
                    onClick={() => selectBoard(item)}
                >
                    {item.type === BoardTypeOpen && <Globe/>}
                    {item.type === BoardTypePrivate && <LockOutline/>}
                    <span className='resultTitle'>{resultTitle}</span>
                    <span className='teamTitle'>{teamTitle}</span>
                </div>
            )
        })
    }

    return (
        <div
            style={{padding: 20}}
            className='focalboard-body'
        >
            <div style={{display: 'flex'}}>
                {/* TODO: translate this */}
                <span style={{flexGrow: 1, fontSize: 16, fontWeight: 600}}>{'Linked Channels'}</span>
                <Button
                    onClick={() => setSearchingChannel(true)}
                    icon={<AddIcon/>}
                    emphasis='primary'
                >
                    {/* TODO: translate this */}
                    {'Add'}
                </Button>
                {searchingChannel &&
                    <SearchDialog
                        onClose={() => setSearchingChannel(false)}
                        title='whatever'
                        searchHandler={searchHandler}
                    />}
            </div>
            {channelBoards.map((b) => (
                <div
                    key={b.id}
                    onClick={() => handleBoardClicked(b.id)}
                    style={{padding: 15, textAlign: 'left', border: '1px solid #cccccc', borderRadius: 5, marginTop: 10, cursor: 'pointer'}}
                >
                    <div style={{fontSize: 16, display: 'flex'}}>
                        {b.icon && <span style={{marginRight: 10}}>{b.icon}</span>}
                        <span style={{fontWeight: 600, flexGrow: 1}}>{b.title}</span>
                        <MenuWrapper stopPropagationOnToggle={true}>
                            <IconButton icon={<OptionsIcon/>}/>
                            <Menu
                                fixed={true}
                                position='left'
                            >
                                <Menu.Text
                                    key={`unlinkBoard-${b.id}`}
                                    id='unlinkBoard'
                                    name={'Unlink Board'}
                                    icon={<DeleteIcon/>}
                                    onClick={() => {
                                        onUnlinkBoard(b)
                                    }}
                                />
                            </Menu>
                        </MenuWrapper>
                    </div>
                    <div>{b.description}</div>
                    {/* TODO: Translate this later */}
                    <div style={{color: '#cccccc'}}>{'Last Update at: '}{b.updateAt}</div>
                </div>))}
        </div>
    )
}

const ConnectedRHSchannelBoards = (props: {getCurrentChannel: () => string}) => (
    <ReduxProvider store={store}>
        <IntlRHSchannelBoards getCurrentChannel={props.getCurrentChannel}/>
    </ReduxProvider>
)

const IntlRHSchannelBoards = (props: {getCurrentChannel: () => string}) => {
    const language = useAppSelector<string>(getLanguage)

    return (
        <IntlProvider
            locale={language.split(/[_]/)[0]}
            messages={getMessages(language)}
        >
            <RHSChannelBoards getCurrentChannel={props.getCurrentChannel}/>
        </IntlProvider>
    )
}

export default ConnectedRHSchannelBoards
