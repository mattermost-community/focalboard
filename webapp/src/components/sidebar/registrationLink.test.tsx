// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import configureStore from 'redux-mock-store'

import {Provider as ReduxProvider} from 'react-redux'

import {render} from '@testing-library/react'

import {wrapIntl} from '../../testUtils'

import {TestBlockFactory} from '../../test/testBlockFactory'

import RegistrationLink from './registrationLink'

describe('components/sidebar/RegistrationLink', () => {
    const mockStore = configureStore([])

    const board = TestBlockFactory.createBoard()
    board.id = 'board1'

    const categoryAttribute1 = TestBlockFactory.createCategoryBoards()
    categoryAttribute1.name = 'Category 1'
    categoryAttribute1.boardIDs = [board.id]

    const state = {
        teams: {
            current: {
                id: 'team-id',
                signupToken: 'abc123'
            },
        },
        boards: {
            current: board.id,
            boards: {
                [board.id]: board,
            },
            myBoardMemberships: {
                [board.id]: board,
            },
        },
        views: {
            views: [],
        },
        users: {
            me: {},
        },
        sidebar: {
            categoryAttributes: [
                categoryAttribute1,
            ],
        },
    }

    test('renders with signupToken in URL query param', () => {
        const store = mockStore(state)

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <RegistrationLink
                    onClose={() => {}}
                />
            </ReduxProvider>,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()

        const anchor = container.querySelector('.shareUrl')
        const url = new URL(anchor?.getAttribute('href') as string)
        expect(url.searchParams.get('t')).toStrictEqual(state.teams.current.signupToken)
    })
})
