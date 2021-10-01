// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {render} from '@testing-library/react'

import configureStore from 'redux-mock-store'

import {Provider as ReduxProvider} from 'react-redux'

import {createMemoryHistory} from 'history'

import {Router} from 'react-router-dom'

import {UserWorkspace} from '../../user'

import {FetchMock} from '../../test/fetchMock'

import {mockMatchMedia, wrapIntl} from '../../testUtils'

import DashboardPage from './dashboardPage'

beforeEach(() => {
    FetchMock.fn.mockReset()
})

beforeAll(() => {
    mockMatchMedia({matches: true})
})

describe('pages/dashboard/DashboardPage', () => {
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
                    <DashboardPage/>
                </Router>
            </ReduxProvider>,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
