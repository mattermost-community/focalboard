// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import configureStore from 'redux-mock-store'
import {Provider as ReduxProvider} from 'react-redux'
import 'isomorphic-fetch'

import {createMemoryHistory} from 'history'

import {fireEvent, render} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import {Router} from 'react-router-dom'

import {wrapIntl} from '../../testUtils'

import {UserWorkspace} from '../../user'

import {FetchMock} from '../../test/fetchMock'

import DashboardCenterContent from './centerContent'

global.fetch = FetchMock.fn

beforeEach(() => {
    FetchMock.fn.mockReset()
})

describe('pages/dashboard/CenterContent', () => {
    const mockStore = configureStore([])
    const workspace1: UserWorkspace = {
        id: 'workspace_1',
        title: 'Workspace 1',
        boardCount: 1,
    }

    const workspace2: UserWorkspace = {
        id: 'workspace_2',
        title: 'Workspace 2',
        boardCount: 2,
    }

    const workspace3: UserWorkspace = {
        id: 'workspace_3',
        title: 'Workspace 3',
        boardCount: 0,
    }

    const workspace4: UserWorkspace = {
        id: 'workspace_4',
        title: 'WS 4',
        boardCount: 3,
    }

    const workspace5: UserWorkspace = {
        id: 'workspace_5',
        title: 'Foo Bar Baz',
        boardCount: 33,
    }

    const workspace6: UserWorkspace = {
        id: 'workspace_6',
        title: 'Workspace 11',
        boardCount: 1,
    }

    const workspace7: UserWorkspace = {
        id: 'workspace_7',
        title: 'Workspace',
        boardCount: 33,
    }

    const workspace8: UserWorkspace = {
        id: 'workspace_8',
        title: 'team 33',
        boardCount: 14,
    }

    const workspace9: UserWorkspace = {
        id: 'workspace_9',
        title: 'Chat6',
        boardCount: 17,
    }

    const workspace10: UserWorkspace = {
        id: 'workspace_10',
        title: 'Title',
        boardCount: 6,
    }

    test('base case - find all workspaces', () => {
        const store = mockStore({
            workspace: {
                userWorkspaces: new Array<UserWorkspace>(workspace1, workspace2, workspace3, workspace4, workspace5, workspace6, workspace7, workspace8),
            },
        })

        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify(new Array<UserWorkspace>(workspace1, workspace2, workspace3, workspace4, workspace5, workspace6, workspace7, workspace8))))

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <DashboardCenterContent/>
            </ReduxProvider>,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('search filter - search for all workspaces that contain the word workspace', () => {
        const store = mockStore({
            workspace: {
                userWorkspaces: new Array<UserWorkspace>(workspace1, workspace2, workspace3),
            },
        })

        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify(new Array<UserWorkspace>(workspace1, workspace2, workspace3))))

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <DashboardCenterContent/>
            </ReduxProvider>,
        )
        const {container} = render(component)
        const searchInput = container.querySelector('.DashboardPage__search > input')
        expect(searchInput).toBeDefined()
        userEvent.type(searchInput!, 'Workspace 1')
        expect(container).toMatchSnapshot()
    })

    test('search filter - search non-existing workspace', () => {
        const store = mockStore({
            workspace: {
                userWorkspaces: new Array<UserWorkspace>(workspace1, workspace2, workspace3),
            },
        })

        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify(new Array<UserWorkspace>())))

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <DashboardCenterContent/>
            </ReduxProvider>,
        )
        const {container} = render(component)
        const searchInput = container.querySelector('.DashboardPage__search > input')
        expect(searchInput).toBeDefined()
        userEvent.type(searchInput!, 'Non-existing one')
        expect(container).toMatchSnapshot()
    })

    test('search filter - search for workspace with unique name', () => {
        const store = mockStore({
            workspace: {
                userWorkspaces: new Array<UserWorkspace>(workspace1, workspace2, workspace3, workspace4, workspace5, workspace6, workspace7, workspace8),
            },
        })

        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify(new Array<UserWorkspace>(workspace4))))

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <DashboardCenterContent/>
            </ReduxProvider>,
        )
        const {container} = render(component)
        const searchInput = container.querySelector('.DashboardPage__search > input')
        expect(searchInput).toBeDefined()
        userEvent.type(searchInput!, 'WS 4')
        expect(container).toMatchSnapshot()
    })

    test('search filter - search for workspace name and amount of boards', () => {
        const store = mockStore({
            workspace: {
                userWorkspaces: new Array<UserWorkspace>(workspace1, workspace2, workspace3, workspace4, workspace5, workspace6, workspace7, workspace8),
            },
        })

        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify(new Array<UserWorkspace>(workspace3, workspace4, workspace8))))

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <DashboardCenterContent/>
            </ReduxProvider>,
        )
        const {container} = render(component)
        const searchInput = container.querySelector('.DashboardPage__search > input')
        expect(searchInput).toBeDefined()
        userEvent.type(searchInput!, 'SOMETHING 3')
        expect(container).toMatchSnapshot()
    })

    test('search filter - search for workspace name and amount of boards 2', () => {
        const store = mockStore({
            workspace: {
                userWorkspaces: new Array<UserWorkspace>(workspace1, workspace2, workspace3, workspace4, workspace5, workspace6, workspace7, workspace8),
            },
        })

        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify(new Array<UserWorkspace>(workspace1, workspace5, workspace7, workspace8))))

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <DashboardCenterContent/>
            </ReduxProvider>,
        )
        const {container} = render(component)
        const searchInput = container.querySelector('.DashboardPage__search > input')
        expect(searchInput).toBeDefined()

        userEvent.type(searchInput!, 'work 33')

        expect(container).toMatchSnapshot()
    })

    test('search filter - search for amount of boards', () => {
        const store = mockStore({
            workspace: {
                userWorkspaces: new Array<UserWorkspace>(workspace1, workspace2, workspace3, workspace4, workspace5, workspace6, workspace7, workspace8),
            },
        })

        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify(new Array<UserWorkspace>(workspace3, workspace8))))

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <DashboardCenterContent/>
            </ReduxProvider>,
        )
        const {container} = render(component)
        const searchInput = container.querySelector('.DashboardPage__search > input')
        expect(searchInput).toBeDefined()

        userEvent.type(searchInput!, '14 0')

        expect(container).toMatchSnapshot()
    })

    test('search filter - search for foo baz', () => {
        const store = mockStore({
            workspace: {
                userWorkspaces: new Array<UserWorkspace>(workspace1, workspace2, workspace3, workspace4, workspace5, workspace6, workspace7, workspace8),
            },
        })

        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify(new Array<UserWorkspace>(workspace5))))

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <DashboardCenterContent/>
            </ReduxProvider>,
        )
        const {container} = render(component)
        const searchInput = container.querySelector('.DashboardPage__search > input')
        expect(searchInput).toBeDefined()
        userEvent.type(searchInput!, 'foo baz')
        expect(container).toMatchSnapshot()
    })

    test('search filter - 5 matching workspaces', () => {
        const store = mockStore({
            workspace: {
                userWorkspaces: new Array<UserWorkspace>(workspace1, workspace2, workspace3, workspace4, workspace5, workspace6, workspace7, workspace8),
            },
        })

        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify(new Array<UserWorkspace>(workspace1, workspace2, workspace3, workspace6, workspace7, workspace8))))

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <DashboardCenterContent/>
            </ReduxProvider>,
        )
        const {container} = render(component)
        const searchInput = container.querySelector('.DashboardPage__search > input')
        expect(searchInput).toBeDefined()

        userEvent.type(searchInput!, 'workspace')

        expect(container).toMatchSnapshot()
    })

    test('search filter - number search', () => {
        const store = mockStore({
            workspace: {
                userWorkspaces: new Array<UserWorkspace>(workspace1, workspace2, workspace3, workspace4, workspace5, workspace6, workspace7, workspace8, workspace9, workspace10),
            },
        })

        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify(new Array<UserWorkspace>(workspace9))))

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <DashboardCenterContent/>
            </ReduxProvider>,
        )
        const {container} = render(component)
        const searchInput = container.querySelector('.DashboardPage__search > input')
        expect(searchInput).toBeDefined()

        userEvent.type(searchInput!, '6')

        expect(container).toMatchSnapshot()
    })

    test('workspace selection', () => {
        const store = mockStore({
            workspace: {
                userWorkspaces: new Array<UserWorkspace>(workspace1, workspace2, workspace3),
            },
        })

        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify(new Array<UserWorkspace>(workspace1, workspace2, workspace3))))

        const history = createMemoryHistory()

        const component = wrapIntl(
            <Router history={history}>
                <ReduxProvider store={store}>
                    <DashboardCenterContent/>
                </ReduxProvider>
            </Router>,
        )

        const {container} = render(component)

        // since workspaces are displayed sorted alphabetically by name,
        // the first one should be Workspace 1
        const targetWorkspace = container.querySelectorAll('.DashboardPage__workspace')[0]
        expect(workspace1).toBeDefined()
        fireEvent.click(targetWorkspace)
        expect(history.location.pathname).toBe('/workspace/workspace_1')
    })
})
