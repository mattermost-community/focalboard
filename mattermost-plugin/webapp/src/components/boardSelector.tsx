// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {ReactNode} from 'react'
import {Provider as ReduxProvider} from 'react-redux'
import {IntlProvider, useIntl} from 'react-intl'

import {getMessages} from '../../../../webapp/src/i18n'
import {getLanguage} from '../../../../webapp/src/store/language'

import store from '../../../../webapp/src/store'
import octoClient from '../../../../webapp/src/octoClient'
import mutator from '../../../../webapp/src/mutator'
import {getCurrentTeam, getAllTeams, Team} from '../../../../webapp/src/store/teams'
import {BoardTypeOpen, BoardTypePrivate, createBoard, Board} from '../../../../webapp/src/blocks/board'
import {useAppSelector, useAppDispatch} from '../../../../webapp/src/store/hooks'
import Globe from '../../../../webapp/src/widgets/icons/globe'
import LockOutline from '../../../../webapp/src/widgets/icons/lockOutline'
import SearchDialog from '../../../../webapp/src/components/searchDialog/searchDialog'
import {getCurrentLinkToChannel, setLinkToChannel} from '../../../../webapp/src/store/boards'

import '../../../../webapp/src/styles/focalboard-variables.scss'
import '../../../../webapp/src/styles/main.scss'
import '../../../../webapp/src/styles/labels.scss'

const BoardSelector = () => {
    const intl = useIntl()
    const teamsById:Record<string, Team> = {}
    useAppSelector(getAllTeams).forEach((t) => {
        teamsById[t.id] = t
    })
    const team = useAppSelector(getCurrentTeam)
    const currentChannel = useAppSelector(getCurrentLinkToChannel)
    const dispatch = useAppDispatch()
    console.log(currentChannel)

    if (!team) {
        return null
    }
    if (!currentChannel) {
        return null
    }

    const selectBoard = async (board: Board): Promise<void> => {
        const newBoard = createBoard(board)
        newBoard.channelId = currentChannel
        await mutator.updateBoard(newBoard, board, 'linked channel')
        dispatch(setLinkToChannel(''))
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
            className='BoardSelector focalboard-body'
        >
            <SearchDialog
                onClose={() => dispatch(setLinkToChannel(''))}
                title='whatever'
                searchHandler={searchHandler}
            />
        </div>
    )
}

const ConnectedBoardSelector = () => (
    <ReduxProvider store={store}>
        <IntlBoardSelector/>
    </ReduxProvider>
)

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

export default ConnectedBoardSelector
