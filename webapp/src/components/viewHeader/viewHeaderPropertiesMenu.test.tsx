// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {render, screen} from '@testing-library/react'
import {Provider as ReduxProvider} from 'react-redux'

import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'

import {BoardView} from '../../blocks/boardView'

import {TestBlockFactory} from '../../test/testBlockFactory'

import {mockStateStore, wrapIntl} from '../../testUtils'

import ViewHeaderPropertiesMenu from './viewHeaderPropertiesMenu'

const board = TestBlockFactory.createBoard()
let activeView:BoardView

describe('components/viewHeader/viewHeaderPropertiesMenu', () => {
    const state = {
        users: {
            me: {
                id: 'user-id-1',
                username: 'username_1'},
        },
    }
    const store = mockStateStore([], state)
    beforeEach(() => {
        jest.clearAllMocks()
        activeView = TestBlockFactory.createBoardView(board)
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
