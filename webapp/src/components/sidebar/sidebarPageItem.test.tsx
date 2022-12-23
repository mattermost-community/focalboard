// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {render} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {Provider as ReduxProvider} from 'react-redux'
import configureStore from 'redux-mock-store'

import {TestBlockFactory} from '../../test/testBlockFactory'

import {wrapIntl, wrapRBDNDDroppable} from '../../testUtils'

import SidebarPageItem from './sidebarPageItem'

describe('components/sidebarPageItem', () => {
    const board = TestBlockFactory.createBoard()
    board.id = 'board_id_1'
    const page1 = TestBlockFactory.createPage()
    page1.boardId = 'board_id_1'
    page1.title = 'Main Page'
    const page2 = TestBlockFactory.createPage()
    page2.boardId = 'board_id_1'
    page2.parentId = page1.id
    page2.title = 'Sub Page'
    const page3 = TestBlockFactory.createPage()
    page3.boardId = 'board_id_1'
    page3.parentId = page2.id
    page3.title = 'Sub Sub Page'
    const pages = [page1, page2, page3]

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
            myBoardMemberships: {
                [board.id]: {userId: 'user_id_1', schemeAdmin: true},
            },
        },
        pages: {
            current: page1.id,
            pages: {
                [page1.id]: page1,
                [page2.id]: page2,
                [page3.id]: page3,
            },
        },
        teams: {
            current: {
                id: 'team-id',
            },
        },
    }

    test('sidebar page item with root active', () => {
        const mockStore = configureStore([])
        const store = mockStore(state)

        const component = wrapRBDNDDroppable(wrapIntl(
            <ReduxProvider store={store}>
                <SidebarPageItem
                    pages={pages}
                    page={page1}
                    currentPageId={page1.id}
                    showBoard={jest.fn()}
                    showPage={jest.fn()}
                    depth={0}
                />
            </ReduxProvider>,
        ))
        const {container} = render(component)
        const elementMenuWrapper = container.querySelector('.SidebarPageItem div.MenuWrapper')
        expect(elementMenuWrapper).not.toBeNull()
        userEvent.click(elementMenuWrapper!)
        expect(container).toMatchSnapshot()
    })

    test('sidebar page item with other item active', () => {
        const mockStore = configureStore([])
        const store = mockStore(state)

        const component = wrapRBDNDDroppable(wrapIntl(
            <ReduxProvider store={store}>
                <SidebarPageItem
                    pages={pages}
                    page={page1}
                    currentPageId={page3.id}
                    showBoard={jest.fn()}
                    showPage={jest.fn()}
                    depth={0}
                />
            </ReduxProvider>,
        ))
        const {container} = render(component)
        const elementMenuWrapper = container.querySelector('.SidebarPageItem div.MenuWrapper')
        expect(elementMenuWrapper).not.toBeNull()
        userEvent.click(elementMenuWrapper!)
        expect(container).toMatchSnapshot()
    })

    test('renders default icon if no custom icon set', () => {
        const mockStore = configureStore([])
        const store = mockStore(state)
        const noIconPage = TestBlockFactory.createPage()
        noIconPage.boardId = 'board_id_1'
        noIconPage.fields.icon = ''

        const component = wrapRBDNDDroppable(wrapIntl(
            <ReduxProvider store={store}>
                <SidebarPageItem
                    pages={[noIconPage]}
                    page={noIconPage}
                    currentPageId={noIconPage.id}
                    showBoard={jest.fn()}
                    showPage={jest.fn()}
                    depth={0}
                />
            </ReduxProvider>,
        ))
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
