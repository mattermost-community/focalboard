// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'
import {render, screen} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import {createBoard} from '../../../../webapp/src/blocks/board'
import {mockStateStore, wrapIntl} from '../../../../webapp/src/testUtils'

import RHSChannelBoardItem from './rhsChannelBoardItem'

describe('components/rhsChannelBoardItem', () => {
    it('render board', async () => {
        const state = {
            teams: {
                current: {
                    id: 'team-id',
                    name: 'team',
                    display_name: 'Team name',
                },
            },
        }
        const board = createBoard()
        board.title = 'Test board'

        const store = mockStateStore([], state)
        const {container} = render(wrapIntl(
            <ReduxProvider store={store}>
                <RHSChannelBoardItem board={board} />
            </ReduxProvider>
        ))
        expect(container).toMatchSnapshot()
    })

    it('render board with menu open', async () => {
        const state = {
            teams: {
                current: {
                    id: 'team-id',
                    name: 'team',
                    display_name: 'Team name',
                },
            },
        }
        const board = createBoard()
        board.title = 'Test board'

        const store = mockStateStore([], state)
        const {container} = render(wrapIntl(
            <ReduxProvider store={store}>
                <RHSChannelBoardItem board={board} />
            </ReduxProvider>
        ))

        const buttonElement = screen.getByRole('button', {name: 'menuwrapper'})
        await userEvent.click(buttonElement)

        expect(container).toMatchSnapshot()
    })
})
