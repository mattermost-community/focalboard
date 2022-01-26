// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import configureStore from 'redux-mock-store'

import {createMemoryHistory} from 'history'
import {Provider as ReduxProvider} from 'react-redux'
import {Router} from 'react-router-dom'

import {render} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {UserWorkspace} from '../../user'

import {mockMatchMedia, wrapIntl} from '../../testUtils'

import Sidebar from './sidebar'

beforeAll(() => {
    mockMatchMedia({matches: true})
})

describe('components/sidebarSidebar', () => {
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

    test('sidebar in dashboard page', () => {
        const store = mockStore({
            workspace: {
                userWorkspaces: new Array<UserWorkspace>(workspace1, workspace2, workspace3),
            },
            boards: {
                boards: [],
            },
            views: {
                views: [],
            },
            users: {
                me: {},
            },
        })

        const history = createMemoryHistory()

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <Router history={history}>
                    <Sidebar isDashboard={true}/>
                </Router>
            </ReduxProvider>,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('sidebar hidden', () => {
        const store = mockStore({
            workspace: {
                userWorkspaces: new Array<UserWorkspace>(workspace1, workspace2, workspace3),
            },
            boards: {
                boards: [],
            },
            views: {
                views: [],
            },
            users: {
                me: {},
            },
        })

        const history = createMemoryHistory()

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <Router history={history}>
                    <Sidebar isDashboard={true}/>
                </Router>
            </ReduxProvider>,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()

        const hideSidebar = container.querySelector('button > .HideSidebarIcon')
        expect(hideSidebar).toBeDefined()

        userEvent.click(hideSidebar as Element)
        expect(container).toMatchSnapshot()

        const showSidebar = container.querySelector('button > .ShowSidebarIcon')
        expect(showSidebar).toBeDefined()
    })

    test('sidebar expect hidden', () => {
        const customGlobal = global as any

        customGlobal.innerWidth = 500

        const store = mockStore({
            workspace: {
                userWorkspaces: new Array<UserWorkspace>(workspace1, workspace2, workspace3),
            },
            boards: {
                boards: [],
            },
            views: {
                views: [],
            },
            users: {
                me: {},
            },
        })

        const history = createMemoryHistory()

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <Router history={history}>
                    <Sidebar isDashboard={true}/>
                </Router>
            </ReduxProvider>,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()

        const hideSidebar = container.querySelector('button > .HideSidebarIcon')
        expect(hideSidebar).toBeNull()

        const showSidebar = container.querySelector('button > .ShowSidebarIcon')
        expect(showSidebar).toBeDefined()

        customGlobal.innerWidth = 1024
    })
})
