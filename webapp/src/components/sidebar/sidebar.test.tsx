// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import configureStore from 'redux-mock-store'

import {createMemoryHistory} from 'history'
import {Provider as ReduxProvider} from 'react-redux'
import {Router} from 'react-router-dom'

import {render} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import thunk from 'redux-thunk'

import {mockMatchMedia, wrapIntl} from '../../testUtils'

import {TestBlockFactory} from '../../test/testBlockFactory'

import Sidebar from './sidebar'

beforeAll(() => {
    mockMatchMedia({matches: true})
})

describe('components/sidebarSidebar', () => {
    const mockStore = configureStore([thunk])

    const board = TestBlockFactory.createBoard()
    board.id = 'board1'

    const categoryAttribute1 = TestBlockFactory.createCategoryBoards()
    categoryAttribute1.name = 'Category 1'
    categoryAttribute1.boardIDs = [board.id]

    test('sidebar hidden', () => {
        const store = mockStore({
            teams: {
                current: {id: 'team-id'},
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
        })

        const history = createMemoryHistory()

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <Router history={history}>
                    <Sidebar/>
                </Router>
            </ReduxProvider>,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()

        const hideSidebar = container.querySelector('button > .HideSidebarIcon')
        expect(hideSidebar).toBeDefined()

        userEvent.click(hideSidebar as Element)
        expect(container).toMatchSnapshot()

        const showSidebar = container.querySelector('button > .ShowSidebarIcon')
        expect(showSidebar).toBeDefined()
    })

    test('sidebar expect hidden', () => {
        const customGlobal = global as any

        customGlobal.innerWidth = 500

        const store = mockStore({
            teams: {
                current: {id: 'team-id'},
            },
            boards: {
                current: board.id,
                boards: {
                    [board.id]: board,
                },
                myBoardMemberships: {
                    [board.id]: board,
                }
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
        })

        const history = createMemoryHistory()

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <Router history={history}>
                    <Sidebar/>
                </Router>
            </ReduxProvider>,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()

        const hideSidebar = container.querySelector('button > .HideSidebarIcon')
        expect(hideSidebar).toBeNull()

        const showSidebar = container.querySelector('button > .ShowSidebarIcon')
        expect(showSidebar).toBeDefined()

        customGlobal.innerWidth = 1024
    })

    // TODO: Fix this later
    // test('global templates', () => {
    //     const store = mockStore({
    //         teams: {
    //             current: {id: 'team-id'},
    //         },
    //         boards: {
    //             boards: [],
    //             templates: [
    //                 {id: '1', title: 'Template 1', fields: {icon: '🚴🏻‍♂️'}},
    //                 {id: '2', title: 'Template 2', fields: {icon: '🚴🏻‍♂️'}},
    //                 {id: '3', title: 'Template 3', fields: {icon: '🚴🏻‍♂️'}},
    //                 {id: '4', title: 'Template 4', fields: {icon: '🚴🏻‍♂️'}},
    //             ],
    //         },
    //         views: {
    //             views: [],
    //         },
    //         users: {
    //             me: {},
    //         },
    //         globalTemplates: {
    //             value: [],
    //         },
    //         sidebar: {
    //             categoryAttributes: [
    //                 categoryAttribute1,
    //             ],
    //         },
    //     })

    //     const history = createMemoryHistory()

    //     const component = wrapIntl(
    //         <ReduxProvider store={store}>
    //             <Router history={history}>
    //                 <Sidebar/>
    //             </Router>
    //         </ReduxProvider>,
    //     )
    //     const {container} = render(component)
    //     expect(container).toMatchSnapshot()

    //     const addBoardButton = container.querySelector('.SidebarAddBoardMenu > .MenuWrapper')
    //     expect(addBoardButton).toBeDefined()
    //     userEvent.click(addBoardButton as Element)
    //     const templates = container.querySelectorAll('.SidebarAddBoardMenu > .MenuWrapper div:not(.hideOnWidescreen).menu-options .menu-name')
    //     expect(templates).toBeDefined()

    //     console.log(templates[0].innerHTML)
    //     console.log(templates[1].innerHTML)

    //     // 4 mocked templates, one "Select a template", one "Empty Board" and one "+ New Template"
    //     expect(templates.length).toBe(7)
    // })
})
