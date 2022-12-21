// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import '@testing-library/jest-dom'
import {act, render} from '@testing-library/react'

import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'
import {MemoryRouter} from 'react-router-dom'

import {TestBlockFactory} from '../test/testBlockFactory'
import {mockDOM, mockStateStore, wrapIntl} from '../testUtils'

import NoPages from './noPages'

jest.mock('react-router-dom', () => {
    const originalModule = jest.requireActual('react-router-dom')

    return {
        ...originalModule,
        useRouteMatch: jest.fn(() => {
            return {url: '/'}
        }),
    }
})

beforeAll(() => {
    mockDOM()
})

describe('components/noPages', () => {
    const board = TestBlockFactory.createBoard()
    board.id = 'test-id'
    const state = {
        users: {
            me: {id: 'me-id', is_guest: false},
            boardUsers: {
                1: {username: 'abc'},
                2: {username: 'd'},
                3: {username: 'e'},
                4: {username: 'f'},
                5: {username: 'g'},
            },
        },
        teams: {
            current: {id: 'team-id'},
        },
        boards: {
            current: board.id,
            boards: {
                [board.id]: board,
            },
            myBoardMemberships: {
                [board.id]: {userId: 'user_id_1', schemeAdmin: true},
            },
        },
        clientConfig: {
            value: {},
        },
    }
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('should match snapshot', async () => {
        const store = mockStateStore([], state)

        let container
        await act(async () => {
            const result = render(wrapIntl(
                <ReduxProvider store={store}>
                    <NoPages/>
                </ReduxProvider>,
            ), {wrapper: MemoryRouter})
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot as guest', async () => {
        const store = mockStateStore([], {...state, users: {...state.users, me: {id: 'me-id', is_guest: true}}})

        let container
        await act(async () => {
            const result = render(wrapIntl(
                <ReduxProvider store={store}>
                    <NoPages/>
                </ReduxProvider>,
            ), {wrapper: MemoryRouter})
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })
})
