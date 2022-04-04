// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {createMemoryHistory} from 'history'
import {Router} from 'react-router-dom'

import {render} from '@testing-library/react'

import {Provider as ReduxProvider} from 'react-redux'

import configureStore from 'redux-mock-store'

import {TestBlockFactory} from '../../test/testBlockFactory'

import {wrapIntl} from '../../testUtils'

import SidebarBoardItem from './sidebarBoardItem'

describe('components/sidebarBoardItem', () => {
    const board = TestBlockFactory.createBoard()

    const view = TestBlockFactory.createBoardView(board)
    view.fields.sortOptions = []
    const history = createMemoryHistory()

    const categoryBlocks1 = TestBlockFactory.createCategoryBlocks()
    categoryBlocks1.name = 'Category 1'
    categoryBlocks1.blockIDs = [board.id]

    const categoryBlocks2 = TestBlockFactory.createCategoryBlocks()
    categoryBlocks2.name = 'Category 2'

    const categoryBlocks3 = TestBlockFactory.createCategoryBlocks()
    categoryBlocks3.name = 'Category 3'

    const allCategoryBlocks = [
        categoryBlocks1,
        categoryBlocks2,
        categoryBlocks3,
    ]

    const state = {
        users: {
            me: {
                id: 'user_id_1',
            },
        },
        boards: {
            current: board.id,
            boards: {
                [board.id]: board,
            },
        },
        views: {
            current: view.id,
            views: {
                [view.id]: view,
            },
        },
        teams: {
            current: {
                id: 'team-id',
            },
        },
    }

    test('sidebar board item', () => {
        const mockStore = configureStore([])
        const store = mockStore(state)

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <Router history={history}>
                    <SidebarBoardItem
                        categoryBlocks={categoryBlocks1}
                        board={board}
                        allCategories={allCategoryBlocks}
                        isActive={true}
                        showBoard={jest.fn()}
                        showView={jest.fn()}
                        onDeleteRequest={jest.fn()}
                    />
                </Router>
            </ReduxProvider>,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
