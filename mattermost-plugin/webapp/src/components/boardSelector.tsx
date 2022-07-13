// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useMemo, useCallback} from 'react'
import {IntlProvider, useIntl, FormattedMessage} from 'react-intl'
import debounce from 'lodash/debounce'

import {getMessages} from '../../../../webapp/src/i18n'
import {getLanguage} from '../../../../webapp/src/store/language'

import octoClient from '../../../../webapp/src/octoClient'
import mutator from '../../../../webapp/src/mutator'
import {getCurrentTeam, getAllTeams, Team} from '../../../../webapp/src/store/teams'
import {createBoard, BoardsAndBlocks, Board} from '../../../../webapp/src/blocks/board'
import {createBoardView} from '../../../../webapp/src/blocks/boardView'
import {useAppSelector, useAppDispatch} from '../../../../webapp/src/store/hooks'
import {EmptySearch, EmptyResults} from '../../../../webapp/src/components/searchDialog/searchDialog'
import ConfirmationDialog from '../../../../webapp/src/components/confirmationDialogBox'
import Dialog from '../../../../webapp/src/components/dialog'
import SearchIcon from '../../../../webapp/src/widgets/icons/search'
import Button from '../../../../webapp/src/widgets/buttons/button'
import {getCurrentLinkToChannel, setLinkToChannel} from '../../../../webapp/src/store/boards'
import TelemetryClient, {TelemetryCategory, TelemetryActions} from '../../../../webapp/src/telemetry/telemetryClient'

import BoardSelectorItem from './boardSelectorItem'

import './boardSelector.scss'

const BoardSelector = () => {
    const teamsById:Record<string, Team> = {}
    useAppSelector(getAllTeams).forEach((t) => {
        teamsById[t.id] = t
    })
    const intl = useIntl()
    const team = useAppSelector(getCurrentTeam)
    const currentChannel = useAppSelector(getCurrentLinkToChannel)
    const dispatch = useAppDispatch()

    const [results, setResults] = useState<Array<Board>>([])
    const [isSearching, setIsSearching] = useState<boolean>(false)
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [showLinkBoardConfirmation, setShowLinkBoardConfirmation] = useState<Board|null>(null)

    const searchHandler = useCallback(async (query: string): Promise<void> => {
        setSearchQuery(query)

        if (query.trim().length === 0 || !team) {
            return
        }
        const items = await octoClient.search(team.id, query)

        setResults(items)
        setIsSearching(false)
    }, [team?.id])

    const debouncedSearchHandler = useMemo(() => debounce(searchHandler, 200), [searchHandler])

    const emptyResult = results.length === 0 && !isSearching && searchQuery

    if (!team) {
        return null
    }
    if (!currentChannel) {
        return null
    }

    const linkBoard = async (board: Board, confirmed?: boolean): Promise<void> => {
        if (!confirmed) {
            setShowLinkBoardConfirmation(board)
            return
        }
        const newBoard = createBoard(board)
        newBoard.channelId = currentChannel
        await mutator.updateBoard(newBoard, board, 'linked channel')
        for (const result of results) {
            if (result.id == board.id) {
                result.channelId = currentChannel
                setResults([...results])
            }
        }
        setShowLinkBoardConfirmation(null)
    }

    const unlinkBoard = async (board: Board): Promise<void> => {
        const newBoard = createBoard(board)
        newBoard.channelId = ''
        await mutator.updateBoard(newBoard, board, 'unlinked channel')
        for (const result of results) {
            if (result.id == board.id) {
                result.channelId = ''
                setResults([...results])
            }
        }
    }

    const newLinkedBoard = async (): Promise<void> => {
        const board = createBoard()
        board.teamId = team.id
        board.channelId = currentChannel

        const view = createBoardView()
        view.fields.viewType = 'board'
        view.parentId = board.id
        view.boardId = board.id
        view.title = intl.formatMessage({id: 'View.NewBoardTitle', defaultMessage: 'Board view'})

        await mutator.createBoardsAndBlocks(
            {boards: [board], blocks: [view]},
            'add linked board',
            async (bab: BoardsAndBlocks): Promise<void> => {
                const windowAny: any = window
                const newBoard = bab.boards[0]
                // TODO: Maybe create a new event for create linked board
                TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateBoard, {board: newBoard?.id})
                windowAny.WebappUtils.browserHistory.push(`/boards/team/${team.id}/${newBoard.id}`)
                dispatch(setLinkToChannel(''))
            },
            async () => {return},
        )
    }

    return (
        <div className='focalboard-body'>
            <Dialog
                className='BoardSelector'
                onClose={() => dispatch(setLinkToChannel(''))}
            >
                {showLinkBoardConfirmation &&
                    <ConfirmationDialog
                        dialogBox={{
                            heading: intl.formatMessage({id: 'boardSelector.confirm-link-board', defaultMessage: 'Link board to channel'}),
                            subText: intl.formatMessage({
                                id: 'boardSelector.confirm-link-board-subtext',
                                defaultMessage: 'Linking the "{boardName}" board to this channel would give all members of this channel "Editor" access to the board. Are you sure you want to link it?'
                            }, {boardName: showLinkBoardConfirmation.title}),
                            confirmButtonText: intl.formatMessage({id: 'boardSelector.confirm-link-board-button', defaultMessage: 'Yes, link board'}),
                            onConfirm: () => linkBoard(showLinkBoardConfirmation, true),
                            onClose: () => setShowLinkBoardConfirmation(null),
                        }}
                    />}
                <div className='BoardSelectorBody'>
                    <div className='head'>
                        <div className='heading'>
                            <h3 className='text-heading4'>
                                <FormattedMessage
                                    id='boardSelector.title'
                                    defaultMessage='Link boards'
                                />
                            </h3>
                            <Button
                                onClick={() => newLinkedBoard()}
                                emphasis='secondary'
                            >
                                <FormattedMessage 
                                    id='boardSelector.create-a-board'
                                    defaultMessage='Create a board'
                                />
                            </Button>
                        </div>
                        <div className='queryWrapper'>
                            <SearchIcon/>
                            <input
                                className='searchQuery'
                                placeholder={intl.formatMessage({id: 'boardSelector.search-for-boards', defaultMessage:'Search for boards'})}
                                type='text'
                                onChange={(e) => debouncedSearchHandler(e.target.value)}
                                autoFocus={true}
                                maxLength={100}
                            />
                        </div>
                    </div>
                    <div className='searchResults'>
                        {/*When there are results to show*/}
                        {searchQuery && results.length > 0 &&
                            results.map((result) => (<BoardSelectorItem
                                key={result.id}
                                item={result}
                                linkBoard={linkBoard}
                                unlinkBoard={unlinkBoard}
                                currentChannel={currentChannel}
                            />))}

                        {/*when user searched for something and there were no results*/}
                        {emptyResult && <EmptyResults query={searchQuery}/>}

                        {/*default state, when user didn't search for anything. This is the initial screen*/}
                        {!emptyResult && !searchQuery && <EmptySearch/>}
                    </div>
                </div>
            </Dialog>
        </div>
    )
}

const IntlBoardSelector = () => {
    const language = useAppSelector<string>(getLanguage)

    return (
        <IntlProvider
            locale={language.split(/[_]/)[0]}
            messages={getMessages(language)}
        >
            <BoardSelector/>
        </IntlProvider>
    )
}

export default IntlBoardSelector
