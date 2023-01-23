// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import '@testing-library/jest-dom'
import {act, render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import React from 'react'

import {TestBlockFactory} from '../../test/testBlockFactory'
import {wrapIntl} from '../../testUtils'

import Breadcrumbs from './breadcrumbs'

describe('components/breadcrumbs', () => {
    const board = TestBlockFactory.createBoard()
    board.title = 'BoardTitle'
    board.id = 'test-id'

    const page1 = TestBlockFactory.createPage(board)
    page1.id = 'page1id'
    page1.parentId = ''
    page1.title = 'Page1Title'

    const page2 = TestBlockFactory.createPage(board)
    page2.id = 'page2id'
    page2.parentId = page1.id
    page2.title = 'Page2Title'

    const page3 = TestBlockFactory.createPage(board)
    page3.id = 'page3id'
    page3.parentId = page2.id
    page3.title = 'Page3Title'

    const page4 = TestBlockFactory.createPage(board)
    page4.id = 'page4id'
    page4.parentId = page1.id
    page4.title = 'Page4Title'

    const pages = [page1, page2, page3, page4]

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('should match snapshot', async () => {
        let container
        await act(async () => {
            const result = render(wrapIntl(
                <Breadcrumbs
                    activePage={page3}
                    board={board}
                    pages={pages}
                    showPage={jest.fn()}
                />,
            ))
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })

    test('click the board name should show the main page of that board', async () => {
        const showPage = jest.fn()
        render(wrapIntl(
            <Breadcrumbs
                activePage={page3}
                board={board}
                pages={pages}
                showPage={showPage}
            />,
        ))
        const boardLink = screen.getByText(board.title)
        userEvent.click(boardLink)
        expect(showPage).toBeCalledWith('')
    })

    test('click the page name should show the that page', async () => {
        const showPage = jest.fn()
        render(wrapIntl(
            <Breadcrumbs
                activePage={page3}
                board={board}
                pages={pages}
                showPage={showPage}
            />,
        ))
        const pageLink = screen.getByText(page2.title)
        userEvent.click(pageLink)
        expect(showPage).toBeCalledWith(page2.id)
    })
})
