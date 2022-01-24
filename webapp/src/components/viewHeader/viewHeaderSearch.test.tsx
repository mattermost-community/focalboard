// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {render, screen} from '@testing-library/react'
import {Provider as ReduxProvider} from 'react-redux'

import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'

import {mockStateStore, wrapIntl} from '../../testUtils'

import ViewHeaderSearch from './viewHeaderSearch'

jest.mock('react-router-dom', () => {
    const originalModule = jest.requireActual('react-router-dom')

    return {
        ...originalModule,
        useRouteMatch: jest.fn(() => {
            return {url: '/board/view'}
        }),
    }
})

describe('components/viewHeader/ViewHeaderSearch', () => {
    const state = {
        users: {
            me: {
                id: 'user-id-1',
                username: 'username_1'},
        },
        searchText: {
        },
    }

    const store = mockStateStore([], state)
    beforeEach(() => {
        jest.clearAllMocks()
    })
    test('return search menu', () => {
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <ViewHeaderSearch/>
                </ReduxProvider>,
            ),
        )
        expect(container).toMatchSnapshot()
    })
    test('return input after click on search button', () => {
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <ViewHeaderSearch/>
                </ReduxProvider>,
            ),
        )
        const buttonElement = screen.getByRole('button')
        userEvent.click(buttonElement)
        expect(container).toMatchSnapshot()
    })
    test('search text after input after click on search button and search text', () => {
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <ViewHeaderSearch/>
                </ReduxProvider>,
            ),
        )
        userEvent.click(screen.getByRole('button'))
        const elementSearchText = screen.getByPlaceholderText('Search text')
        userEvent.type(elementSearchText, 'Hello')
        expect(container).toMatchSnapshot()
    })
})
