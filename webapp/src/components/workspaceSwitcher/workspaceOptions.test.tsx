// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import configureStore from 'redux-mock-store'

import {IntlProvider} from 'react-intl'
import {Provider as ReduxProvider} from 'react-redux'

import {render} from '@testing-library/react'

import {UserWorkspace} from '../../user'

import WorkspaceOptions from './workspaceOptions'

const wrapProviders = (children: any) => {
    return (
        <IntlProvider locale='en'>{children}</IntlProvider>
    )
}

describe('components/workspaceSwitcher/WorkspaceOptions', () => {
    const mockStore = configureStore([])

    const workspace1: UserWorkspace = {
        id: 'worktest(\'2 more workspaces available\', () => {\n' +
            '        const store = mockStore({\n' +
            '            users: {\n' +
            '                userWorkspaces: new Array<UserWorkspace>(workspace1, workspace2, workspace3),\n' +
            '            },\n' +
            '        })\n' +
            '\n' +
            '        const component = wrapProviders(\n' +
            '            <ReduxProvider store={store}>\n' +
            '                <WorkspaceOptions\n' +
            '                    onChange={() => {\n' +
            '                    }}\n' +
            '                    activeWorkspaceId={workspace1.id}\n' +
            '                />\n' +
            '            </ReduxProvider>,\n' +
            '        )\n' +
            '\n' +
            '        const {container} = render(component)\n' +
            '        expect(container).toMatchSnapshot()\n' +
            '    })space_1',
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

    test('no more workspaces available', () => {
        const store = mockStore({
            users: {
                userWorkspaces: [],
            },
        })

        const component = wrapProviders(
            <ReduxProvider store={store}>
                <WorkspaceOptions
                    onChange={() => {
                    }}
                    activeWorkspaceId={workspace1.id}
                />
            </ReduxProvider>,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
