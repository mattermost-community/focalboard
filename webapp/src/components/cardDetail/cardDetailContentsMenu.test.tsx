// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'

import {TestBlockFactory} from '../../test/testBlockFactory'

import {wrapIntl, mockStateStore} from '../../testUtils'

import CardDetailContentsMenu from './cardDetailContentsMenu'

const board = TestBlockFactory.createBoard()
const card = TestBlockFactory.createCard(board)
describe('components/cardDetail/cardDetailContentsMenu', () => {
    // const state = {
    //     users: {
    //         me: {
    //             id: 'user-id-1',
    //             username: 'username_1',
    //         },
    //     },
    // }
    const store = mockStateStore([], {})
    beforeEach(() => {
        jest.clearAllMocks()
    })
    test('return cardDetailContentsMenu', () => {
        const {container} = render(wrapIntl(
            <ReduxProvider store={store}>
                <CardDetailContentsMenu card={card}/>
            </ReduxProvider>,
        ))
        const buttonElement = screen.getByRole('button', {name: 'menuwrapper'})
        userEvent.click(buttonElement)
        expect(container).toMatchSnapshot()
    })

    test('return cardDetailContentsMenu and add content', () => {
        const {container} = render(wrapIntl(
            <ReduxProvider store={store}>
                <CardDetailContentsMenu card={card}/>
            </ReduxProvider>,
        ))
        screen.debug()
        const buttonElement = screen.getByRole('button', {name: 'menuwrapper'})
        userEvent.click(buttonElement)
        screen.debug()
        const buttonAdd = screen.getByRole('button', {name: 'Add content'})
        userEvent.click(buttonAdd)
        screen.debug()
        expect(container).toMatchSnapshot()
    })
})
