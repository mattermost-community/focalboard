// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {act, render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {Provider as ReduxProvider} from 'react-redux'
import thunk from 'redux-thunk'

import React from 'react'
import {MemoryRouter} from 'react-router'
import {mocked} from 'jest-mock'

import {IUser} from '../../user'
import {ISharing} from '../../blocks/sharing'
import {TestBlockFactory} from '../../test/testBlockFactory'
import {mockStateStore, wrapDNDIntl} from '../../testUtils'
import client from '../../octoClient'
import {Utils} from '../../utils'

import ShareBoard from './shareBoard'

jest.useFakeTimers()

const boardId = '1'
const workspaceId: string|undefined = boardId
const viewId = boardId

jest.mock('../../octoClient')
jest.mock('../../utils')

const mockedOctoClient = mocked(client, true)
const mockedUtils = mocked(Utils, true)

let params = {}
jest.mock('react-router', () => {
    const originalModule = jest.requireActual('react-router')

    return {
        ...originalModule,
        useRouteMatch: jest.fn(() => {
            return {
                url: 'http://localhost/',
                path: '/',
                params,
                isExact: true,
            }
        }),
    }
})

const board = TestBlockFactory.createBoard()
board.id = boardId
board.teamId = 'team-id'
board.cardProperties = [
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
const fakeBoard = {id: board.id}
activeView.boardId = fakeBoard.id
const card1 = TestBlockFactory.createCard(board)
card1.id = 'card1'
card1.title = 'card-1'
card1.boardId = fakeBoard.id
const card2 = TestBlockFactory.createCard(board)
card2.id = 'card2'
card2.title = 'card-2'
card2.boardId = fakeBoard.id
const card3 = TestBlockFactory.createCard(board)
card3.id = 'card3'
card3.title = 'card-3'
card3.boardId = fakeBoard.id

const me: IUser = {id: 'user-id-1', username: 'username_1', email: '', props: {}, create_at: 0, update_at: 0, is_bot: false}

const categoryAttribute1 = TestBlockFactory.createCategoryBoards()
categoryAttribute1.name = 'Category 1'
categoryAttribute1.boardIDs = [board.id]

describe('src/components/shareBoard/shareBoard', () => {
    const w = (window as any)
    const oldBaseURL = w.baseURL

    const state = {
        teams: {
            current: {id: 'team-id', title: 'Test Team'},
        },
        users: {
            me,
            boardUsers: [me],
            blockSubscriptions: [],
        },
        boards: {
            current: board.id,
            boards: {
                [board.id]: board,
            },
            templates: [],
            membersInBoards: {
                [board.id]: {},
            },
            myBoardMemberships: {
                [board.id]: {userId: me.id, schemeAdmin: true},
            },
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
        sidebar: {
            categoryAttributes: [
                categoryAttribute1,
            ],
        },
    }

    const store = mockStateStore([thunk], state)
    beforeEach(() => {
        jest.clearAllMocks()
        mockedUtils.buildURL.mockImplementation((path) => (w.baseURL || '') + path)

        params = {
            boardId,
            viewId,
            workspaceId,
        }
    })

    afterEach(() => {
        w.baseURL = oldBaseURL
    })

    test('should match snapshot', async () => {
        const sharing:ISharing = {
            id: '',
            enabled: false,
            token: '',
        }
        mockedOctoClient.getSharing.mockResolvedValue(sharing)
        let container
        await act(async () => {
            const result = render(
                wrapDNDIntl(
                    <ReduxProvider store={store}>
                        <ShareBoard
                            onClose={jest.fn()}
                            enableSharedBoards={true}
                        />
                    </ReduxProvider>),
                {wrapper: MemoryRouter},
            )
            container = result.container
        })

        expect(container).toMatchSnapshot()
        const closeButton = screen.getByRole('button', {name: 'Close dialog'})
        expect(closeButton).toBeDefined()
    })

    test('should match snapshot with sharing', async () => {
        const sharing:ISharing = {
            id: boardId,
            enabled: true,
            token: 'oneToken',
        }
        mockedOctoClient.getSharing.mockResolvedValue(sharing)

        let container
        await act(async () => {
            const result = render(
                wrapDNDIntl(
                    <ReduxProvider store={store}>
                        <ShareBoard
                            onClose={jest.fn()}
                            enableSharedBoards={true}
                        />
                    </ReduxProvider>),
                {wrapper: MemoryRouter},
            )
            container = result.container
        })
        const copyLinkElement = screen.getByRole('button', {name: 'Copy internal link'})
        expect(copyLinkElement).toBeDefined()

        expect(container).toMatchSnapshot()
    })

    test('return shareBoard and click Copy link', async () => {
        const sharing:ISharing = {
            id: boardId,
            enabled: true,
            token: 'oneToken',
        }
        mockedOctoClient.getSharing.mockResolvedValue(sharing)

        let container
        await act(async () => {
            const result = render(
                wrapDNDIntl(
                    <ReduxProvider store={store}>
                        <ShareBoard
                            onClose={jest.fn()}
                            enableSharedBoards={true}
                        />
                    </ReduxProvider>),
                {wrapper: MemoryRouter},
            )
            container = result.container
        })

        expect(container).toMatchSnapshot()

        const copyLinkElement = screen.getByRole('button', {name: 'Copy internal link'})
        expect(copyLinkElement).toBeDefined()

        await act(async () => {
            userEvent.click(copyLinkElement!)
        })

        expect(mockedUtils.copyTextToClipboard).toBeCalledTimes(1)
        expect(container).toMatchSnapshot()

        const copiedLinkElement = screen.getByRole('button', {name: 'Copy internal link'})
        expect(copiedLinkElement).toBeDefined()
        expect(copiedLinkElement.textContent).toContain('Copied!')
    })

    test('return shareBoard and click Regenerate token', async () => {
        window.confirm = jest.fn(() => {
            return true
        })
        const sharing:ISharing = {
            id: boardId,
            enabled: true,
            token: 'oneToken',
        }
        mockedOctoClient.getSharing.mockResolvedValue(sharing)

        let container
        await act(async () => {
            const result = render(
                wrapDNDIntl(
                    <ReduxProvider store={store}>
                        <ShareBoard
                            onClose={jest.fn()}
                            enableSharedBoards={true}
                        />
                    </ReduxProvider>),
                {wrapper: MemoryRouter},
            )
            container = result.container
        })

        sharing.token = 'anotherToken'
        mockedUtils.createGuid.mockReturnValue('anotherToken')
        mockedOctoClient.getSharing.mockResolvedValue(sharing)
        mockedOctoClient.setSharing.mockResolvedValue(true)

        const publishButton = screen.getByRole('button', {name: 'Publish'})
        expect(publishButton).toBeDefined()
        userEvent.click(publishButton)
        await act(async () => {
            jest.runOnlyPendingTimers()
        })

        const regenerateTokenElement = screen.getByRole('button', {name: 'Regenerate token'})
        expect(regenerateTokenElement).toBeDefined()
        userEvent.click(regenerateTokenElement)
        await act(async () => {
            jest.runOnlyPendingTimers()
        })
        expect(mockedOctoClient.setSharing).toBeCalledTimes(1)
        expect(container).toMatchSnapshot()
    })
    test('return shareBoard, and click switch', async () => {
        const sharing:ISharing = {
            id: boardId,
            enabled: true,
            token: 'oneToken',
        }
        mockedOctoClient.getSharing.mockResolvedValue(sharing)
        let container: Element | undefined
        await act(async () => {
            const result = render(
                wrapDNDIntl(
                    <ReduxProvider store={store}>
                        <ShareBoard
                            onClose={jest.fn()}
                            enableSharedBoards={true}
                        />
                    </ReduxProvider>),
                {wrapper: MemoryRouter},
            )
            container = result.container
        })

        const publishButton = screen.getByRole('button', {name: 'Publish'})
        expect(publishButton).toBeDefined()
        userEvent.click(publishButton)
        await act(async () => {
            jest.runOnlyPendingTimers()
        })

        const switchElement = container?.querySelector('.Switch')
        expect(switchElement).toBeDefined()
        await act(async () => {
            userEvent.click(switchElement!)
        })

        expect(mockedOctoClient.setSharing).toBeCalledTimes(1)
        expect(mockedOctoClient.getSharing).toBeCalledTimes(2)
        expect(container).toMatchSnapshot()
    })
    test('return shareBoardComponent and click Switch without sharing', async () => {
        const sharing:ISharing = {
            id: '',
            enabled: false,
            token: '',
        }
        mockedOctoClient.getSharing.mockResolvedValue(sharing)
        mockedUtils.createGuid.mockReturnValue('aToken')
        let container: Element | undefined
        await act(async () => {
            const result = render(
                wrapDNDIntl(
                    <ReduxProvider store={store}>
                        <ShareBoard
                            onClose={jest.fn()}
                            enableSharedBoards={true}
                        />
                    </ReduxProvider>),
                {wrapper: MemoryRouter},
            )
            container = result.container
            mockedOctoClient.getSharing.mockResolvedValue({
                id: boardId,
                enabled: true,
                token: 'aToken',
            })

            const publishButton = screen.getByRole('button', {name: 'Publish'})
            expect(publishButton).toBeDefined()
            userEvent.click(publishButton)
            jest.runOnlyPendingTimers()

            const switchElement = container?.querySelector('.Switch')
            expect(switchElement).toBeDefined()
            userEvent.click(switchElement!)
            jest.runOnlyPendingTimers()
            result.rerender(
                wrapDNDIntl(
                    <ReduxProvider store={store}>
                        <ShareBoard
                            onClose={jest.fn()}
                            enableSharedBoards={true}
                        />
                    </ReduxProvider>))
        })

        expect(mockedOctoClient.setSharing).toBeCalledTimes(1)
        expect(mockedOctoClient.getSharing).toBeCalledTimes(2)
        expect(mockedUtils.createGuid).toBeCalledTimes(1)
        expect(container).toMatchSnapshot()
    })
    test('should match snapshot with sharing and without workspaceId and subpath', async () => {
        w.baseURL = '/test-subpath/plugins/boards'
        const sharing:ISharing = {
            id: boardId,
            enabled: true,
            token: 'oneToken',
        }
        params = {
            boardId,
            viewId,
        }
        mockedOctoClient.getSharing.mockResolvedValue(sharing)
        let container
        await act(async () => {
            const result = render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <ShareBoard
                        onClose={jest.fn()}
                        enableSharedBoards={true}
                    />
                </ReduxProvider>),
            {wrapper: MemoryRouter})
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot with sharing and subpath', async () => {
        w.baseURL = '/test-subpath/plugins/boards'
        const sharing:ISharing = {
            id: boardId,
            enabled: true,
            token: 'oneToken',
        }
        mockedOctoClient.getSharing.mockResolvedValue(sharing)
        let container
        await act(async () => {
            const result = render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <ShareBoard
                        onClose={jest.fn()}
                        enableSharedBoards={true}
                    />
                </ReduxProvider>),
            {wrapper: MemoryRouter})
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })

    test('return shareBoard and click Select', async () => {
        const sharing:ISharing = {
            id: '',
            enabled: false,
            token: '',
        }
        mockedOctoClient.getSharing.mockResolvedValue(sharing)
        mockedUtils.isFocalboardPlugin.mockReturnValue(true)

        const users:IUser[] = [
            {id: 'userid1', username: 'username_1'} as IUser,
            {id: 'userid2', username: 'username_2'} as IUser,
            {id: 'userid3', username: 'username_3'} as IUser,
            {id: 'userid4', username: 'username_4'} as IUser,
        ]

        mockedOctoClient.searchTeamUsers.mockResolvedValue(users)

        let container
        await act(async () => {
            const result = render(
                wrapDNDIntl(
                    <ReduxProvider store={store}>
                        <ShareBoard
                            onClose={jest.fn()}
                            enableSharedBoards={false}
                        />
                    </ReduxProvider>),
                {wrapper: MemoryRouter},
            )
            container = result.container
        })

        expect(container).toMatchSnapshot()
        const selectElement = screen.getByText('Select...')
        expect(selectElement).toBeDefined()

        await act(async () => {
            userEvent.click(selectElement!)
        })

        expect(container).toMatchSnapshot()
    })

    test('return shareBoard and click Select, non-plugin mode', async () => {
        const sharing:ISharing = {
            id: '',
            enabled: false,
            token: '',
        }
        mockedOctoClient.getSharing.mockResolvedValue(sharing)
        const users:IUser[] = [
            {id: 'userid1', username: 'username_1'} as IUser,
            {id: 'userid2', username: 'username_2'} as IUser,
            {id: 'userid3', username: 'username_3'} as IUser,
            {id: 'userid4', username: 'username_4'} as IUser,
        ]

        mockedOctoClient.searchTeamUsers.mockResolvedValue(users)

        let container
        await act(async () => {
            const result = render(
                wrapDNDIntl(
                    <ReduxProvider store={store}>
                        <ShareBoard
                            onClose={jest.fn()}
                            enableSharedBoards={false}
                        />
                    </ReduxProvider>),
                {wrapper: MemoryRouter},
            )
            container = result.container
        })

        expect(container).toMatchSnapshot()
        const selectElement = screen.getByText('Select...')
        expect(selectElement).toBeDefined()

        await act(async () => {
            userEvent.click(selectElement!)
        })

        expect(container).toMatchSnapshot()
    })
})
