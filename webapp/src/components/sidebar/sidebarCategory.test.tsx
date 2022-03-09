// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {createMemoryHistory} from 'history'
import {Router} from 'react-router-dom'

import {render} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {Provider as ReduxProvider} from 'react-redux'

import configureStore from 'redux-mock-store'

import {TestBlockFactory} from '../../test/testBlockFactory'

import {wrapIntl} from '../../testUtils'

import SidebarCategory from './sidebarCategory'

describe('components/sidebarCategory', () => {
    const board = TestBlockFactory.createBoard()

    const view = TestBlockFactory.createBoardView(board)
    view.fields.sortOptions = []
    const history = createMemoryHistory()

    const board1 = TestBlockFactory.createBoard()
    const board2 = TestBlockFactory.createBoard()
    const boards = [board1, board2]
    const categoryBlocks1 = TestBlockFactory.createCategoryBlocks()
    categoryBlocks1.name = 'Category 1'
    categoryBlocks1.blockIDs = [board1.id, board2.id]

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

    test('sidebar call hideSidebar', () => {
        const mockStore = configureStore([])
        const store = mockStore(state)

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <Router history={history}>
                    <SidebarCategory
                        hideSidebar={() => {}}
                        categoryBlocks={categoryBlocks1}
                        boards={boards}
                        allCategories={allCategoryBlocks}
                    />
                </Router>
            </ReduxProvider>,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()

        // testing collapsed state of category
        const subItems = container.querySelectorAll('.category > .IconButton')
        expect(subItems).toBeDefined()
        userEvent.click(subItems[0] as Element)
        expect(container).toMatchSnapshot()
    })
})
