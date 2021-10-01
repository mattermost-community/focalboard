// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import configureStore from 'redux-mock-store'

import {Provider as ReduxProvider} from 'react-redux'

import {render} from '@testing-library/react'

import {wrapIntl} from '../../testUtils'

import {UserWorkspace} from '../../user'

import WorkspaceOptions from './workspaceOptions'

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
                <WorkspaceOptions
                    onChange={() => {}}
                    activeWorkspaceId={workspace1.id}
                />
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
                <WorkspaceOptions
                    onChange={() => {}}
                    activeWorkspaceId={workspace1.id}
                />
            </ReduxProvider>,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
