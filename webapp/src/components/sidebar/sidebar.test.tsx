// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import configureStore from 'redux-mock-store'

import {createMemoryHistory} from 'history'
import {Provider as ReduxProvider} from 'react-redux'
import {Router} from 'react-router-dom'

import {render} from '@testing-library/react'

import {IntlProvider} from 'react-intl'

import {UserWorkspace} from '../../user'

import {FetchMock} from '../../test/fetchMock'

import {mockMatchMedia} from '../../testUtils'

import Sidebar from './sidebar'

const wrapProviders = (children: any) => {
    return (
        <IntlProvider locale='en'>{children}</IntlProvider>
    )
}

beforeEach(() => {
    FetchMock.fn.mockReset()
})

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

        const component = wrapProviders(
            <ReduxProvider store={store}>
                <Router history={history}>
                    <Sidebar isDashboard={true}/>
                </Router>
            </ReduxProvider>,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
