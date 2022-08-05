// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useMemo, useCallback} from 'react'
import {IntlProvider, useIntl, FormattedMessage} from 'react-intl'
import debounce from 'lodash/debounce'

import {getMessages} from '../../../../webapp/src/i18n'
import {getLanguage} from '../../../../webapp/src/store/language'

import {useWebsockets} from '../../../../webapp/src/hooks/websockets'

import octoClient from '../../../../webapp/src/octoClient'
import mutator from '../../../../webapp/src/mutator'
import {getCurrentTeamId, getAllTeams, Team} from '../../../../webapp/src/store/teams'
import {createBoard, Board} from '../../../../webapp/src/blocks/board'
import {useAppSelector, useAppDispatch} from '../../../../webapp/src/store/hooks'
import {EmptySearch, EmptyResults} from '../../../../webapp/src/components/searchDialog/searchDialog'
import ConfirmationDialog from '../../../../webapp/src/components/confirmationDialogBox'
import Dialog from '../../../../webapp/src/components/dialog'
import SearchIcon from '../../../../webapp/src/widgets/icons/search'
import Button from '../../../../webapp/src/widgets/buttons/button'
import {getCurrentLinkToChannel, setLinkToChannel} from '../../../../webapp/src/store/boards'
import {WSClient} from '../../../../webapp/src/wsclient'
import {SuiteWindow} from '../../../../webapp/src/types/index'

import BoardSelectorItem from './boardSelectorItem'

const windowAny = (window as SuiteWindow)

import './boardSelector.scss'

const BoardSelector = () => {
    const teamsById:Record<string, Team> = {}
    useAppSelector(getAllTeams).forEach((t) => {
        teamsById[t.id] = t
    })
    const intl = useIntl()
    const teamId = useAppSelector(getCurrentTeamId)
    const currentChannel = useAppSelector(getCurrentLinkToChannel)
    const dispatch = useAppDispatch()

    const [results, setResults] = useState<Array<Board>>([])
    const [isSearching, setIsSearching] = useState<boolean>(false)
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [showLinkBoardConfirmation, setShowLinkBoardConfirmation] = useState<Board|null>(null)

    const searchHandler = useCallback(async (query: string): Promise<void> => {
        setSearchQuery(query)

        if (query.trim().length === 0 || !teamId) {
            return
        }
        const items = await octoClient.search(teamId, query)

        setResults(items)
        setIsSearching(false)
    }, [teamId])

    const debouncedSearchHandler = useMemo(() => debounce(searchHandler, 200), [searchHandler])

    const emptyResult = results.length === 0 && !isSearching && searchQuery

    useWebsockets(teamId, (wsClient: WSClient) => {
        const onChangeBoardHandler = (_: WSClient, boards: Board[]): void => {
            const newResults = [...results]
            let updated = false
            results.forEach((board, idx) => {
                for (const newBoard of boards) {
                    if (newBoard.id == board.id) {
                        newResults[idx] = newBoard
                        updated = true
                    }
                }
            })
            if (updated) {
                setResults(newResults)
            }
        }

        wsClient.addOnChange(onChangeBoardHandler, 'board')

        return () => {
            wsClient.removeOnChange(onChangeBoardHandler, 'board')
        }
    }, [results])


    if (!teamId) {
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
        const newBoard = createBoard({...board, channelId: currentChannel})
        await mutator.updateBoard(newBoard, board, 'linked channel')
        setShowLinkBoardConfirmation(null)
    }

    const unlinkBoard = async (board: Board): Promise<void> => {
        const newBoard = createBoard({...board, channelId: ''})
        await mutator.updateBoard(newBoard, board, 'unlinked channel')
    }

    const newLinkedBoard = async (): Promise<void> => {
        window.open(`${windowAny.frontendBaseURL}/team/${teamId}/new/${currentChannel}`, '_blank', 'noopener')
        dispatch(setLinkToChannel(''))
    }

    let confirmationSubText
    if (showLinkBoardConfirmation?.channelId !== '') {
        confirmationSubText = intl.formatMessage({
            id: 'boardSelector.confirm-link-board-subtext-with-other-channel',
            defaultMessage: 'Linking the "{boardName}" board to this channel would give all members of this channel "Editor" access to the board.\n\nAdditionally, this board is linked to another channel, and will be unlinked from the other channel when you link it here.\n\nAre you sure you want to link it?'
        }, {boardName: showLinkBoardConfirmation?.title})
    } else {
        confirmationSubText = intl.formatMessage({
            id: 'boardSelector.confirm-link-board-subtext',
            defaultMessage: 'Linking the "{boardName}" board to this channel would give all members of this channel "Editor" access to the board.\n\nAre you sure you want to link it?'
        }, {boardName: showLinkBoardConfirmation?.title})
    }

    return (
        <div className='focalboard-body'>
            <Dialog
                className='BoardSelector'
                onClose={() => {
                    dispatch(setLinkToChannel(''))
                    setResults([])
                    setIsSearching(false)
                    setSearchQuery('')
                    setShowLinkBoardConfirmation(null)
                }}
            >
                {showLinkBoardConfirmation &&
                    <ConfirmationDialog
                        dialogBox={{
                            heading: intl.formatMessage({id: 'boardSelector.confirm-link-board', defaultMessage: 'Link board to channel'}),
                            subText: confirmationSubText,
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
