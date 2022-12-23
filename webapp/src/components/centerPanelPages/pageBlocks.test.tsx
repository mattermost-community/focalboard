// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {mocked} from 'jest-mock'
import {Provider as ReduxProvider} from 'react-redux'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {mockDOM, mockStateStore, wrapDNDIntl} from '../../testUtils'
import {TestBlockFactory} from '../../test/testBlockFactory'
import {createTextBlock} from '../../blocks/textBlock'
import {IUser} from '../../user'
import octoClient from '../../octoClient'
import {Constants} from '../../constants'

import PageBlocks from './pageBlocks'
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
describe('components/pageBlocks', () => {
    const board = TestBlockFactory.createBoard()
    board.id = '1'
    board.teamId = 'team-id'
    const activePage = TestBlockFactory.createPage(board)
    activePage.id = '1'

    const content1 = createTextBlock()
    content1.title = 'text content 1'
    content1.boardId = board.id
    content1.parentId = activePage.id
    const content2 = createTextBlock()
    content2.title = 'text content 2'
    content2.boardId = board.id
    content2.parentId = activePage.id
    const content3 = createTextBlock()
    content3.title = 'text content 3'
    content3.boardId = board.id
    content3.parentId = activePage.id

    activePage.fields.contentOrder = [content1.id, content2.id, content3.id]

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
            contents: [content1, content2, content3],
            contentsByCard: {},
            contentsByPage: {[activePage.id]: [content1, content2, content3]},
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
                <PageBlocks
                    board={board}
                    activePage={activePage}
                    readonly={false}
                    canEditBoardCards={true}
                />
            </ReduxProvider>,
        ))
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot after click one content block', () => {
        const {container} = render(wrapDNDIntl(
            <ReduxProvider store={store}>
                <PageBlocks
                    board={board}
                    activePage={activePage}
                    readonly={false}
                    canEditBoardCards={true}
                />
            </ReduxProvider>,
        ))
        const boardLink = screen.getAllByTestId('block-content')[0]
        userEvent.click(boardLink)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot when readonly', () => {
        const {container} = render(wrapDNDIntl(
            <ReduxProvider store={store}>
                <PageBlocks
                    board={board}
                    activePage={activePage}
                    readonly={true}
                    canEditBoardCards={true}
                />
            </ReduxProvider>,
        ))
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot without edit board cards permission', () => {
        const {container} = render(wrapDNDIntl(
            <ReduxProvider store={store}>
                <PageBlocks
                    board={board}
                    activePage={activePage}
                    readonly={false}
                    canEditBoardCards={false}
                />
            </ReduxProvider>,
        ))
        expect(container).toMatchSnapshot()
    })
})
