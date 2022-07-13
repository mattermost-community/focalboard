// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React  from 'react'
import {FormattedMessage, IntlProvider} from 'react-intl'

import {getMessages} from '../../../../webapp/src/i18n'
import {getLanguage} from '../../../../webapp/src/store/language'

import {getCurrentTeam} from '../../../../webapp/src/store/teams'
import {getCurrentChannel} from '../../../../webapp/src/store/channels'
import {getMySortedBoards, setLinkToChannel} from '../../../../webapp/src/store/boards'
import {useAppSelector, useAppDispatch} from '../../../../webapp/src/store/hooks'
import AddIcon from '../../../../webapp/src/widgets/icons/add'
import Button from '../../../../webapp/src/widgets/buttons/button'

import RHSChannelBoardItem from './rhsChannelBoardItem'

import './rhsChannelBoards.scss'

const boardsScreenshots = (window as any).baseURL + '/public/boards-screenshots.png'

const RHSChannelBoards = () => {
    const boards = useAppSelector(getMySortedBoards)
    const team = useAppSelector(getCurrentTeam)
    const currentChannel = useAppSelector(getCurrentChannel)
    const dispatch = useAppDispatch()

    if (!boards) {
        return null
    }
    if (!team) {
        return null
    }
    if (!currentChannel) {
        return null
    }
    const channelBoards = boards.filter((b) => b.channelId === currentChannel.id)

    if (channelBoards.length === 0) {
        return (
            <div className='focalboard-body'>
                <div className='RHSChannelBoards empty'>
                    <h2>
                        <FormattedMessage
                            id='rhs-boards.no-boards-linked-to-channel'
                            defaultMessage='No boards are linked to {channelName} yet'
                            values={{channelName: currentChannel.display_name}}
                        />
                    </h2>
                    <div className='empty-paragraph'>
                        <FormattedMessage
                            id='rhs-boards.no-boards-linked-to-channel-description'
                            defaultMessage='Boards is a project management tool that helps define, organize, track and manage work across teams, using a familiar kanban board view.'
                        />
                    </div>
                    <div className='boards-screenshots'><img src={boardsScreenshots}/></div>
                    <Button
                        onClick={() => dispatch(setLinkToChannel(currentChannel.id))}
                        emphasis='primary'
                        size='medium'
                    >
                        <FormattedMessage
                            id='rhs-boards.link-boards-to-channel'
                            defaultMessage='Link boards to {channelName}'
                            values={{channelName: currentChannel.display_name}}
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
