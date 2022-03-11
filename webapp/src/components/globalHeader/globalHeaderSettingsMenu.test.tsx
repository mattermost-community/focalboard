// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'
import {createMemoryHistory} from 'history'

import {render} from '@testing-library/react'

import userEvent from '@testing-library/user-event'
import configureStore from 'redux-mock-store'

import {mocked} from 'ts-jest/utils'

import {wrapIntl} from '../../testUtils'

import TelemetryClient, {TelemetryCategory, TelemetryActions} from '../../telemetry/telemetryClient'

import GlobalHeaderSettingsMenu from './globalHeaderSettingsMenu'

jest.mock('../../telemetry/telemetryClient')
const mockedTelemetry = mocked(TelemetryClient, true)

describe('components/sidebar/GlobalHeaderSettingsMenu', () => {
    const mockStore = configureStore([])
    const history = createMemoryHistory()
    let store = mockStore({})
    beforeEach(() => {
        store = mockStore({
            teams: {
                current: {id: 'team_id_1'},
            },
            boards: {
                current: 'board_id',
                boards: {
                    board_id: {id: 'board_id'},
                },
                myBoardMemberships: {
                    board_id: {userId: 'user_id_1', schemeAdmin: true},
                },
            },
            users: {
                me: {
                    id: 'user-id',
                },
            },
        })
    })
    test('settings menu closed should match snapshot', () => {
        const component = wrapIntl(
            <ReduxProvider store={store}>
                <GlobalHeaderSettingsMenu history={history}/>
            </ReduxProvider>,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('settings menu open should match snapshot', () => {
        const component = wrapIntl(
            <ReduxProvider store={store}>
                <GlobalHeaderSettingsMenu history={history}/>
            </ReduxProvider>,
        )

        const {container} = render(component)
        userEvent.click(container.querySelector('.menu-entry') as Element)
        expect(container).toMatchSnapshot()
    })

    test('languages menu open should match snapshot', () => {
        const component = wrapIntl(
            <ReduxProvider store={store}>
                <GlobalHeaderSettingsMenu history={history}/>
            </ReduxProvider>,
        )

        const {container} = render(component)
        userEvent.click(container.querySelector('.menu-entry') as Element)
        userEvent.hover(container.querySelector('#lang') as Element)
        expect(container).toMatchSnapshot()
    })

    test('imports menu open should match snapshot', () => {
        window.open = jest.fn()
        const component = wrapIntl(
            <ReduxProvider store={store}>
                <GlobalHeaderSettingsMenu history={history}/>
            </ReduxProvider>,
        )

        const {container} = render(component)
        userEvent.click(container.querySelector('.menu-entry') as Element)
        userEvent.hover(container.querySelector('#import') as Element)
        expect(container).toMatchSnapshot()

        userEvent.click(container.querySelector('[aria-label="Asana"]') as Element)
        expect(mockedTelemetry.trackEvent).toBeCalledWith(TelemetryCategory, TelemetryActions.ImportAsana)
    })
})
