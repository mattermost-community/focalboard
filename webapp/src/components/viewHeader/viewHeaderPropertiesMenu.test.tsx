// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {ReactElement} from 'react'
import {render, screen} from '@testing-library/react'
import {Provider as ReduxProvider} from 'react-redux'
import configureStore from 'redux-mock-store'

import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'

import {IntlProvider} from 'react-intl'

import {TestBlockFactory} from '../../test/testBlockFactory'

import ViewHeaderPropertiesMenu from './viewHeaderPropertiesMenu'

const wrapIntl = (children: ReactElement) => (
    <IntlProvider locale='en'>{children}</IntlProvider>
)
const board = TestBlockFactory.createBoard()
const activeView = TestBlockFactory.createBoardView(board)

describe('components/viewHeader/viewHeaderGroupByMenu', () => {
    const state = {
        users: {
            me: {
                id: 'user-id-1',
                username: 'username_1'},
        },
    }
    const mockStore = configureStore([])
    const store = mockStore(state)
    beforeEach(() => {
        jest.clearAllMocks()
    })
    test('return properties menu', () => {
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <ViewHeaderPropertiesMenu
                        activeView={activeView}
                        properties={board.fields.cardProperties}
                    />
                </ReduxProvider>,
            ),
        )
        const buttonElement = screen.getByRole('button', {name: 'menuwrapper'})
        userEvent.click(buttonElement)
        expect(container).toMatchSnapshot()
    })
    test('return properties menu with gallery typeview', () => {
        activeView.fields.viewType = 'gallery'
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <ViewHeaderPropertiesMenu
                        activeView={activeView}
                        properties={board.fields.cardProperties}
                    />
                </ReduxProvider>,
            ),
        )
        const buttonElement = screen.getByRole('button', {name: 'menuwrapper'})
        userEvent.click(buttonElement)
        expect(container).toMatchSnapshot()
    })
})
