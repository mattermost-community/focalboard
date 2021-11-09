// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {act, render} from '@testing-library/react'
import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'
import {MemoryRouter} from 'react-router-dom'
import {mocked} from 'ts-jest/utils'

import userEvent from '@testing-library/user-event'

import {IUser, UserWorkspace} from '../user'
import {TestBlockFactory} from '../test/testBlockFactory'
import {mockDOM, mockMatchMedia, mockStateStore, wrapDNDIntl} from '../testUtils'
import {Constants} from '../constants'
import {Utils} from '../utils'

import Workspace from './workspace'

Object.defineProperty(Constants, 'versionString', {value: '1.0.0'})
jest.useFakeTimers()
jest.mock('../utils')
const mockedUtils = mocked(Utils, true)
const workspace1: UserWorkspace = {
    id: 'workspace_1',
    title: 'Workspace 1',
    boardCount: 1,
}
const board = TestBlockFactory.createBoard()
board.id = 'board1'
board.rootId = 'root1'
board.workspaceId = workspace1.id
board.fields.cardProperties = [
    {
        id: 'property1',
        name: 'Property 1',
        type: 'text',
        options: [
            {
                id: 'value1',
                value: 'value 1',
                color: 'propColorBrown',
            },
        ],
    },
    {
        id: 'property2',
        name: 'Property 2',
        type: 'select',
        options: [
            {
                id: 'value2',
                value: 'value 2',
                color: 'propColorBlue',
            },
        ],
    },
]
const activeView = TestBlockFactory.createBoardView(board)
activeView.id = 'view1'
activeView.fields.hiddenOptionIds = []
activeView.fields.visiblePropertyIds = ['property1']
activeView.fields.visibleOptionIds = ['value1']
activeView.workspaceId = workspace1.id
const card1 = TestBlockFactory.createCard(board)
card1.id = 'card1'
card1.title = 'card-1'
card1.workspaceId = workspace1.id
const card2 = TestBlockFactory.createCard(board)
card2.id = 'card2'
card2.title = 'card-2'
card2.workspaceId = workspace1.id
const card3 = TestBlockFactory.createCard(board)
card3.id = 'card3'
card3.title = 'card-3'
card3.workspaceId = workspace1.id

const me: IUser = {id: 'user-id-1', username: 'username_1', email: '', props: {}, createAt: 0, updateAt: 0}

jest.mock('react-router-dom', () => {
    const originalModule = jest.requireActual('react-router-dom')

    return {
        ...originalModule,
        useRouteMatch: jest.fn(() => {
            return {
                params: {
                    boardId: board.id,
                    viewId: activeView.id,
                    cardId: card1.id,
                },
            }
        }),
    }
})

describe('src/components/workspace', () => {
    const state = {
        workspace: {
            current: workspace1,
        },
        users: {
            me,
            workspaceUsers: [me],
        },
        boards: {
            current: board.id,
            boards: {
                [board.id]: board,
            },
            templates: [],
        },
        globalTemplates: {
            value: [],
        },
        views: {
            views: {
                [activeView.id]: activeView,
            },
            current: activeView.id,
        },
        cards: {
            templates: [],
            cards: [card1, card2, card3],
        },
        searchText: {},
        clientConfig: {
            value: {
                telemetry: true,
                telemetryid: 'telemetry',
                enablePublicSharedBoards: true,
                featureFlags: {},
            },
        },
        contents: {
            contents: {},
        },
        comments: {
            comments: {},
        },
    }
    const store = mockStateStore([], state)
    beforeAll(() => {
        mockDOM()
        mockMatchMedia({matches: true})
    })
    beforeEach(() => {
        jest.clearAllMocks()
        mockedUtils.createGuid.mockReturnValue('test-id')
    })
    test('should match snapshot', async () => {
        let container
        await act(async () => {
            const result = render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <Workspace readonly={false}/>
                </ReduxProvider>,
            ), {wrapper: MemoryRouter})
            container = result.container
            jest.runOnlyPendingTimers()
        })
        expect(container).toMatchSnapshot()
    })
    test('should match snapshot with readonly', async () => {
        let container
        await act(async () => {
            const result = render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <Workspace readonly={true}/>
                </ReduxProvider>,
            ), {wrapper: MemoryRouter})
            container = result.container
            jest.runOnlyPendingTimers()
        })
        expect(container).toMatchSnapshot()
    })
    test('return workspace and showcard', async () => {
        let container:Element | undefined
        await act(async () => {
            const result = render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <Workspace readonly={false}/>
                </ReduxProvider>,
            ), {wrapper: MemoryRouter})
            container = result.container
            jest.runOnlyPendingTimers()
            const cardElements = container!.querySelectorAll('.KanbanCard')
            expect(cardElements).toBeDefined()
            const cardElement = cardElements[0]
            userEvent.click(cardElement)
        })
        expect(container).toMatchSnapshot()
    })
    test('return workspace readonly and showcard', async () => {
        let container:Element | undefined
        await act(async () => {
            const result = render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <Workspace readonly={true}/>
                </ReduxProvider>,
            ), {wrapper: MemoryRouter})
            container = result.container
            jest.runOnlyPendingTimers()
            const cardElements = container!.querySelectorAll('.KanbanCard')
            expect(cardElements).toBeDefined()
            const cardElement = cardElements[0]
            userEvent.click(cardElement)
        })
        expect(container).toMatchSnapshot()
        expect(mockedUtils.getReadToken).toBeCalledTimes(1)
    })
    test('return workspace with EmptyCenterPanel component', async () => {
        const emptyStore = mockStateStore([], {
            users: {
                me,
                workspaceUsers: [me],
            },
            workspace: {
                current: workspace1,
            },
            boards: {
                current: board.id,
                boards: {
                    [board.id]: board,
                },
                templates: [],
            },
            views: {
                views: {},
            },
            cards: {
                cards: [],
            },
            globalTemplates: {
                value: [],
            },
            searchText: {},
            clientConfig: {
                value: {
                    telemetry: true,
                    telemetryid: 'telemetry',
                    enablePublicSharedBoards: true,
                    featureFlags: {},
                },
            },
        })
        let container:Element | undefined
        await act(async () => {
            const result = render(wrapDNDIntl(
                <ReduxProvider store={emptyStore}>
                    <Workspace readonly={true}/>
                </ReduxProvider>,
            ), {wrapper: MemoryRouter})
            container = result.container
            jest.runOnlyPendingTimers()
        })

        expect(container).toMatchSnapshot()
    })
})
