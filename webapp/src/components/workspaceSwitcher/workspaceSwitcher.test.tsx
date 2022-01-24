// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import configureStore from 'redux-mock-store'

import {Provider as ReduxProvider} from 'react-redux'

import {render} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import {createMemoryHistory} from 'history'

import {Router} from 'react-router-dom'

import {wrapIntl} from '../../testUtils'

import {UserWorkspace} from '../../user'

import {UserSettings} from '../../userSettings'

import WorkspaceSwitcher from './workspaceSwitcher'

describe('components/workspaceSwitcher/WorkspaceSwitcher', () => {
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
        boardCount: 3,
    }

    test('2 more workspaces available', () => {
        const store = mockStore({
            workspace: {
                userWorkspaces: new Array<UserWorkspace>(workspace1, workspace2, workspace3),
            },
        })

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <WorkspaceSwitcher/>
            </ReduxProvider>,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('no more workspaces available', () => {
        const store = mockStore({
            workspace: {
                userWorkspaces: [],
            },
        })

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <WorkspaceSwitcher/>
            </ReduxProvider>,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('open menu', () => {
        const store = mockStore({
            workspace: {
                userWorkspaces: new Array<UserWorkspace>(workspace1, workspace2, workspace3),
            },
        })

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <WorkspaceSwitcher/>
            </ReduxProvider>,
        )

        const {container} = render(component)
        const switcher = container.querySelector('.WorkspaceSwitcher')

        expect(switcher).toBeDefined()
        expect(switcher).not.toBeNull()

        userEvent.click(switcher as Element)
        expect(container).toMatchSnapshot()
    })

    test('switch workspaces', () => {
        const store = mockStore({
            workspace: {
                userWorkspaces: new Array<UserWorkspace>(workspace1, workspace2, workspace3),
            },
        })
        const history = createMemoryHistory()
        history.push = jest.fn()

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <Router history={history}>
                    <WorkspaceSwitcher/>
                </Router>
            </ReduxProvider>,
        )

        const {container} = render(component)
        const switcher = container.querySelector('.WorkspaceSwitcher')
        expect(switcher).toBeDefined()
        expect(switcher).not.toBeNull()

        userEvent.click(switcher as Element)
        const workspace2Option = container.querySelector('.WorkspaceOptions__menu-list > div:nth-child(3)')
        expect(workspace2Option).toBeDefined()
        expect(workspace2Option).not.toBeNull()
        userEvent.click(workspace2Option as Element)
        expect(history.push).toBeCalledWith('/workspace/workspace_2')
        expect(UserSettings.lastWorkspaceId).toBe('workspace_2')

        userEvent.click(switcher as Element)
        const workspace3Option = container.querySelector('.WorkspaceOptions__menu-list > div:nth-child(4)')
        expect(workspace3Option).toBeDefined()
        expect(workspace3Option).not.toBeNull()
        userEvent.click(workspace3Option as Element)
        expect(history.push).toBeCalledWith('/workspace/workspace_3')
        expect(UserSettings.lastWorkspaceId).toBe('workspace_3')

        userEvent.click(switcher as Element)
        const dashboardOption = container.querySelector('.WorkspaceOptions__menu-list > div:nth-child(1)')
        expect(dashboardOption).toBeDefined()
        expect(dashboardOption).not.toBeNull()
        userEvent.click(dashboardOption as Element)
        expect(history.push).toBeCalledWith('/dashboard')

        // last workspace ID should not have changed
        expect(UserSettings.lastWorkspaceId).toBe('workspace_3')
    })
})
