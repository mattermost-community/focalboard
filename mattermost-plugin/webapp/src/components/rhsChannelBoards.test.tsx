// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'
import {render} from '@testing-library/react'

import {createBoard} from '../../../../webapp/src/blocks/board'
import {mockStateStore, wrapIntl} from '../../../../webapp/src/testUtils'

import RHSChannelBoards from './rhsChannelBoards'

describe('components/rhsChannelBoards', () => {
    const board1 = createBoard()
    const board2 = createBoard()
    const board3 = createBoard()
    board1.channelId = 'channel-id'
    board3.channelId = 'channel-id'

    const team = {
        id: 'team-id',
        name: 'team',
        display_name: 'Team name',
    }
    const state = {
        teams: {
            allTeams: [team],
            current: team,
        },
        language: {
            value: 'en',
        },
        boards: {
            boards: {
                [board1.id]: board1,
                [board2.id]: board2,
                [board3.id]: board3,
            },
            myBoardMemberships: {
                [board1.id]: {boardId: board1.id, userId: 'user-id'},
                [board2.id]: {boardId: board2.id, userId: 'user-id'},
                [board3.id]: {boardId: board3.id, userId: 'user-id'},
            },
        },
        channels: {
            current: {
                id: 'channel-id',
                name: 'channel',
                display_name: 'Channel Name',
                type: 'O',
            },
        },
    }

    it('renders the RHS for channel boards', async () => {
        const store = mockStateStore([], state)
        const {container} = render(wrapIntl(
            <ReduxProvider store={store}>
                <RHSChannelBoards/>
            </ReduxProvider>
        ))
        expect(container).toMatchSnapshot()
    })

    it('renders with empty list of boards', async () => {
        const localState = {...state, boards: {...state.boards, boards: {}}}
        const store = mockStateStore([], localState)
        const {container} = render(wrapIntl(
            <ReduxProvider store={store}>
                <RHSChannelBoards/>
            </ReduxProvider>
        ))
        expect(container).toMatchSnapshot()
    })
})
