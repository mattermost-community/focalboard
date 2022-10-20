// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState}  from 'react'
import {FormattedMessage, IntlProvider, useIntl} from 'react-intl'

import {getMessages} from '../../../../webapp/src/i18n'
import {getLanguage} from '../../../../webapp/src/store/language'

import {useWebsockets} from '../../../../webapp/src/hooks/websockets'

import {Board, BoardMember} from '../../../../webapp/src/blocks/board'
import {getCurrentTeamId} from '../../../../webapp/src/store/teams'
import {IUser} from '../../../../webapp/src/user'
import {getMe, fetchMe} from '../../../../webapp/src/store/users'
import {loadBoards, loadMyBoardsMemberships} from '../../../../webapp/src/store/initialLoad'
import {getCurrentChannel} from '../../../../webapp/src/store/channels'
import {
    getMySortedBoards,
    setLinkToChannel,
    updateBoards,
    updateMembersEnsuringBoardsAndUsers,
    addMyBoardMemberships,
} from '../../../../webapp/src/store/boards'
import {useAppSelector, useAppDispatch} from '../../../../webapp/src/store/hooks'
import AddIcon from '../../../../webapp/src/widgets/icons/add'
import Button from '../../../../webapp/src/widgets/buttons/button'

import {Utils} from '../../../../webapp/src/utils'
import {WSClient} from '../../../../webapp/src/wsclient'

import boardsScreenshots from '../../../../webapp/static/boards-screenshots.png'

import RHSChannelBoardItem from './rhsChannelBoardItem'

import './rhsChannelBoards.scss'

const RHSChannelBoards = () => {
    const boards = useAppSelector(getMySortedBoards)
    const teamId = useAppSelector(getCurrentTeamId)
    const currentChannel = useAppSelector(getCurrentChannel)
    const me = useAppSelector<IUser|null>(getMe)
    const dispatch = useAppDispatch()
    const intl = useIntl()
    const [dataLoaded, setDataLoaded] = useState(false)

    useEffect(() => {
        async function loadRhsRequiredData() {
            await dispatch(loadBoards())
            await dispatch(loadMyBoardsMemberships())
            await dispatch(fetchMe())
            setDataLoaded(true)
        }
        loadRhsRequiredData()
    }, [])

    useWebsockets(teamId || '', (wsClient: WSClient) => {
        const onChangeBoardHandler = (_: WSClient, boards: Board[]): void => {
            dispatch(updateBoards(boards))
        }
        const onChangeMemberHandler = (_: WSClient, members: BoardMember[]): void => {
            dispatch(updateMembersEnsuringBoardsAndUsers(members))

            if (me) {
                const myBoardMemberships = members.filter((boardMember) => boardMember.userId === me.id)
                dispatch(addMyBoardMemberships(myBoardMemberships))
            }
        }

        wsClient.addOnChange(onChangeBoardHandler, 'board')
        wsClient.addOnChange(onChangeMemberHandler, 'boardMembers')

        return () => {
            wsClient.removeOnChange(onChangeBoardHandler, 'board')
            wsClient.removeOnChange(onChangeMemberHandler, 'boardMembers')
        }
    }, [me])

    if (!boards) {
        return null
    }
    if (!teamId) {
        return null
    }
    if (!currentChannel) {
        return null
    }

    if (!dataLoaded) {
        return null
    }

    const channelBoards = boards.filter((b) => b.channelId === currentChannel.id)

    let channelName = currentChannel.display_name
    let headerChannelName = currentChannel.display_name

    if (currentChannel.type === 'D') {
        channelName = intl.formatMessage({id: 'rhs-boards.dm', defaultMessage: 'DM'})
        headerChannelName = intl.formatMessage({id: 'rhs-boards.header.dm', defaultMessage: 'this Direct Message'})
    } else if (currentChannel.type === 'G') {
        channelName = intl.formatMessage({id: 'rhs-boards.gm', defaultMessage: 'GM'})
        headerChannelName = intl.formatMessage({id: 'rhs-boards.header.gm', defaultMessage: 'this Group Message'})
    }

    if (channelBoards.length === 0) {
        return (
            <div className='focalboard-body'>
                <div className='RHSChannelBoards empty'>
                    <h2>
                        <FormattedMessage
                            id='rhs-boards.no-boards-linked-to-channel'
                            defaultMessage='No boards are linked to {channelName} yet'
                            values={{channelName: headerChannelName}}
                        />
                    </h2>
                    <div className='empty-paragraph'>
                        <FormattedMessage
                            id='rhs-boards.no-boards-linked-to-channel-description'
                            defaultMessage='Boards is a project management tool that helps define, organize, track and manage work across teams, using a familiar kanban board view.'
                        />
                    </div>
                    <div className='boards-screenshots'><img src={Utils.buildURL(boardsScreenshots, true)}/></div>
                    <Button
                        onClick={() => dispatch(setLinkToChannel(currentChannel.id))}
                        emphasis='primary'
                        size='medium'
                    >
                        <FormattedMessage
                            id='rhs-boards.link-boards-to-channel'
                            defaultMessage='Link boards to {channelName}'
                            values={{channelName: channelName}}
                        />
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className='focalboard-body'>
            <div className='RHSChannelBoards'>
                <div className='rhs-boards-header'>
                    <span className='linked-boards'>
                        <FormattedMessage
                            id='rhs-boards.linked-boards'
                            defaultMessage='Linked boards'
                        />
                    </span>
                    <Button
                        onClick={() => dispatch(setLinkToChannel(currentChannel.id))}
                        icon={<AddIcon/>}
                        emphasis='primary'
                    >
                        <FormattedMessage
                            id='rhs-boards.add'
                            defaultMessage='Add'
                        />
                    </Button>
                </div>
                <div className='rhs-boards-list'>
                    {channelBoards.map((b) => (
                        <RHSChannelBoardItem
                            key={b.id}
                            board={b}
                        />))}
                </div>
            </div>
        </div>
    )
}

const IntlRHSChannelBoards = () => {
    const language = useAppSelector<string>(getLanguage)

    return (
        <IntlProvider
            locale={language.split(/[_]/)[0]}
            messages={getMessages(language)}
        >
            <RHSChannelBoards/>
        </IntlProvider>
    )
}

export default IntlRHSChannelBoards
