// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import '@testing-library/jest-dom'
import {act, render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'

import {TestBlockFactory} from '../test/testBlockFactory'
import {mockDOM, mockStateStore, wrapIntl} from '../testUtils'

import PageMenu from './pageMenu'

beforeAll(() => {
    mockDOM()
})

describe('components/pageMenu', () => {
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
                    <PageMenu
                        pageId='fakeId'
                        onClickDelete={jest.fn()}
                        onClickDuplicate={jest.fn()}
                        onClickAddSubpage={jest.fn()}

                    />
                </ReduxProvider>,
            ))
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot after clicks dots menu', async () => {
        const store = mockStateStore([], state)

        let container
        await act(async () => {
            const result = render(wrapIntl(
                <ReduxProvider store={store}>
                    <PageMenu
                        pageId='fakeId'
                        onClickDelete={jest.fn()}
                        onClickDuplicate={jest.fn()}
                        onClickAddSubpage={jest.fn()}

                    />
                </ReduxProvider>,
            ))
            container = result.container
        })

        const dotsMenu = screen.getAllByRole('button')[0]
        userEvent.click(dotsMenu)

        expect(container).toMatchSnapshot()
    })
})
