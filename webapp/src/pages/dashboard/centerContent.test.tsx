// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import configureStore from 'redux-mock-store'
import {Provider as ReduxProvider} from 'react-redux'

import {createMemoryHistory} from 'history'

import {fireEvent, render} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import {Router} from 'react-router-dom'

import {wrapIntl} from '../../testUtils'

import {UserWorkspace} from '../../user'

import DashboardCenterContent from './centerContent'

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

    test('base case', () => {
        const store = mockStore({
            workspace: {
                userWorkspaces: new Array<UserWorkspace>(workspace1, workspace2, workspace3),
            },
        })

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <DashboardCenterContent/>
            </ReduxProvider>,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('search filter', () => {
        const store = mockStore({
            workspace: {
                userWorkspaces: new Array<UserWorkspace>(workspace1, workspace2, workspace3),
            },
        })

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

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <DashboardCenterContent/>
            </ReduxProvider>,
        )
        const {container} = render(component)
        const searchInput = container.querySelector('.DashboardPage__search > input')
        expect(searchInput).toBeDefined()
        userEvent.type(searchInput!, 'Non-existing workspace')
        expect(container).toMatchSnapshot()
    })

    test('workspace selection', () => {
        const store = mockStore({
            workspace: {
                userWorkspaces: new Array<UserWorkspace>(workspace1, workspace2, workspace3),
            },
        })

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
