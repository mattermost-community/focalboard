// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {mocked} from 'jest-mock'
import {Provider as ReduxProvider} from 'react-redux'
import {render} from '@testing-library/react'

import {mockDOM, mockStateStore, wrapDNDIntl} from '../../testUtils'
import {TestBlockFactory} from '../../test/testBlockFactory'
import {IUser} from '../../user'
import octoClient from '../../octoClient'
import {Constants} from '../../constants'

import PageHeader from './pageHeader'
Object.defineProperty(Constants, 'versionString', {value: '1.0.0'})
jest.mock('react-router-dom', () => {
    const originalModule = jest.requireActual('react-router-dom')

    return {
        ...originalModule,
        useRouteMatch: jest.fn(() => {
            return {url: '/board/view'}
        }),
    }
})
jest.mock('../../octoClient')
jest.mock('../../mutator')
jest.mock('../../telemetry/telemetryClient')
jest.mock('draft-js/lib/generateRandomKey', () => () => '123')
const mockedOctoClient = mocked(octoClient, true)
describe('components/pageHeader', () => {
    const board = TestBlockFactory.createBoard()
    board.id = '1'
    board.teamId = 'team-id'
    const activePage = TestBlockFactory.createPage(board)
    activePage.id = '1'

    const state = {
        clientConfig: {
            value: {
                featureFlags: {
                    subscriptions: true,
                },
            },
        },
        searchText: '',
        users: {
            me: {
                id: 'user_id_1',
            },
            myConfig: {
                onboardingTourStarted: {value: false},
            },
            boardUsers: {
                'user-id-1': {username: 'username_1'},
            },
            blockSubscriptions: [],
        },
        teams: {
            current: {id: 'team-id'},
        },
        boards: {
            current: board.id,
            boards: {
                [board.id]: board,
            },
            templates: [],
            myBoardMemberships: {
                [board.id]: {userId: 'user_id_1', schemeAdmin: true},
            },
        },
        limits: {
            limits: {
                cards: 0,
                used_cards: 0,
                card_limit_timestamp: 0,
                views: 0,
            },
        },
        cards: {
            cards: [],
        },
        views: {
            views: {},
        },
        pages: {
            pages: {[activePage.id]: activePage},
            current: activePage.id,
        },
        contents: {
            contents: [],
            contentsByCard: {},
            contentsByPage: {},
        },
        comments: {
            comments: [],
            commentsByCard: {},
        },
        imits: {
            limits: {
                views: 0,
            },
        },
    }
    mockedOctoClient.searchTeamUsers.mockResolvedValue(Object.values(state.users.boardUsers) as IUser[])
    const store = mockStateStore([], state)
    beforeAll(() => {
        mockDOM()
        console.error = jest.fn()
    })
    beforeEach(() => {
        jest.clearAllMocks()
    })
    test('should match snapshot', () => {
        const {container} = render(wrapDNDIntl(
            <ReduxProvider store={store}>
                <PageHeader
                    boardId={board.id}
                    activePage={activePage}
                    readonly={false}
                    enablePublicSharedBoards={true}
                    showPage={jest.fn()}
                />
            </ReduxProvider>,
        ))
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot when readonly', () => {
        const {container} = render(wrapDNDIntl(
            <ReduxProvider store={store}>
                <PageHeader
                    boardId={board.id}
                    activePage={activePage}
                    readonly={true}
                    enablePublicSharedBoards={true}
                    showPage={jest.fn()}
                />
            </ReduxProvider>,
        ))
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot public share boards', () => {
        const {container} = render(wrapDNDIntl(
            <ReduxProvider store={store}>
                <PageHeader
                    boardId={board.id}
                    activePage={activePage}
                    readonly={false}
                    enablePublicSharedBoards={true}
                    showPage={jest.fn()}
                />
            </ReduxProvider>,
        ))
        expect(container).toMatchSnapshot()
    })
})
