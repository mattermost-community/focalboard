// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React  from 'react'
import {Provider as ReduxProvider} from 'react-redux'
import {FormattedMessage, IntlProvider} from 'react-intl'

import {getMessages} from '../../../../webapp/src/i18n'
import {getLanguage} from '../../../../webapp/src/store/language'

import store from '../../../../webapp/src/store'
import {getCurrentTeam} from '../../../../webapp/src/store/teams'
import {getMySortedBoards, setLinkToChannel} from '../../../../webapp/src/store/boards'
import {useAppSelector, useAppDispatch} from '../../../../webapp/src/store/hooks'
import AddIcon from '../../../../webapp/src/widgets/icons/add'
import Button from '../../../../webapp/src/widgets/buttons/button'

import RHSChannelBoardItem from './rhsChannelBoardItem'

import './rhsChannelBoards.scss'

const boardsScreenshots = (window as any).baseURL + '/public/boards-screenshots.png'

// TODO replace the anys for Channel struct

const RHSChannelBoards = (props: {getCurrentChannel: () => any}) => {
    const boards = useAppSelector(getMySortedBoards)
    const team = useAppSelector(getCurrentTeam)
    const dispatch = useAppDispatch()
    if (!boards) {
        return null
    }
    if (!team) {
        return null
    }
    const currentChannel = props.getCurrentChannel()
    const channelBoards = boards.filter((b) => b.channelId === currentChannel.id)

    if (channelBoards.length === 0) {
        return (
        <div className='focalboard-body'>
            <div className='RHSChannelBoards empty'>
                <h2>
                    <FormattedMessage
                        id='rhs-boards.no-boards-linked-to-channel'
                        defaultMessage='No Boards are linked to {channelName} yet'
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
                    onClick={() => dispatch(setLinkToChannel(props.getCurrentChannel().id))}
                    emphasis='primary'
                    size='medium'
                >
                    <FormattedMessage
                        id='rhs-boards.link-boards-to-channel'
                        defaultMessage='Link Boards to {channelName}'
                        values={{channelName: currentChannel.display_name}}
                    />
                </Button>
            </div>
        </div>
    }

    return (
        <div className='focalboard-body'>
            <div className='RHSChannelBoards'>
                <div className='rhs-boards-header'>
                    <span className='linked-boards'>
                        <FormattedMessage
                            id='rhs-boards.linked-boards'
                            defaultMessage='Linked Boards'
                        />
                    </span>
                    <Button
                        onClick={() => dispatch(setLinkToChannel(props.getCurrentChannel().id))}
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

const ConnectedRHSChannelBoards = (props: {getCurrentChannel: () => any}) => (
    <ReduxProvider store={store}>
        <IntlRHSChannelBoards getCurrentChannel={props.getCurrentChannel}/>
    </ReduxProvider>
)

const IntlRHSChannelBoards = (props: {getCurrentChannel: () => any}) => {
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

export default ConnectedRHSChannelBoards
