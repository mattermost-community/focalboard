// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {createMemoryHistory} from 'history'
import {Router} from 'react-router-dom'

import {render} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {TestBlockFactory} from '../../test/testBlockFactory'

import {wrapIntl} from '../../testUtils'

import SidebarBoardItem from './sidebarBoardItem'

describe('components/sidebarBoardItem', () => {
    test('sidebar call hideSidebar', () => {
        const board = TestBlockFactory.createBoard()
        const view = TestBlockFactory.createBoardView(board)

        const view2 = TestBlockFactory.createBoardView(board)
        view2.fields.sortOptions = []
        const history = createMemoryHistory()

        const mockHide = jest.fn()

        const component = wrapIntl(
            <Router history={history}>

                <SidebarBoardItem
                    hideSidebar={mockHide}
                    key={board.id}
                    views={[view, view2]}
                    board={board}
                />
            </Router>,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()

        const subItems = container.querySelectorAll('.subitem > .BoardIcon')
        expect(subItems).toBeDefined()
        userEvent.click(subItems[0] as Element)
        expect(mockHide).toBeCalled()
    })
})
