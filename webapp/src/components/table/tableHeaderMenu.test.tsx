// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {fireEvent, render} from '@testing-library/react'
import '@testing-library/jest-dom'
import {IntlProvider} from 'react-intl'

import 'isomorphic-fetch'

import {Constants} from '../../constants'
import mutator from '../../mutator'

import {TestBlockFactory} from '../../test/testBlockFactory'
import {FetchMock} from '../../test/fetchMock'
import {MutableBoardTree} from '../../viewModel/boardTree'

import TableHeaderMenu from './tableHeaderMenu'

global.fetch = FetchMock.fn

// import mutator from '../../mutator'

jest.mock('../../mutator', () => ({
    changeViewSortOptions: jest.fn(),
    insertPropertyTemplate: jest.fn(),
    changeViewVisibleProperties: jest.fn(),
    duplicatePropertyTemplate: jest.fn(),
    deleteProperty: jest.fn(),
}))

beforeEach(() => {
    jest.resetAllMocks()
    FetchMock.fn.mockReset()
})

const wrapIntl = (children: any) => <IntlProvider locale='en'>{children}</IntlProvider>

describe('components/table/TableHeaderMenu', () => {
    const board = TestBlockFactory.createBoard()
    const view = TestBlockFactory.createBoardView(board)

    const view2 = TestBlockFactory.createBoardView(board)
    view2.sortOptions = []

    const card = TestBlockFactory.createCard(board)
    const cardTemplate = TestBlockFactory.createCard(board)
    cardTemplate.isTemplate = true

    test('should match snapshot, title column', async () => {
        // Sync
        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, view2, card, cardTemplate])))

        const boardTree = await MutableBoardTree.sync(board.id, view.id)
        expect(boardTree).toBeDefined()
        expect(FetchMock.fn).toBeCalledTimes(1)
        const component = wrapIntl(
            <TableHeaderMenu
                templateId={Constants.titleColumnId}
                boardTree={boardTree!}
            />,
        )
        const {container, getByText} = render(component)

        let sort = getByText(/Sort ascending/i)
        fireEvent.click(sort)
        sort = getByText(/Sort descending/i)
        fireEvent.click(sort)
        expect(mutator.changeViewSortOptions).toHaveBeenCalledTimes(2)

        let insert = getByText(/Insert left/i)
        fireEvent.click(insert)
        insert = getByText(/Insert right/i)
        fireEvent.click(insert)
        expect(mutator.insertPropertyTemplate).toHaveBeenCalledTimes(0)

        expect(container).toMatchSnapshot()
    })

    test('should match snapshot, other column', async () => {
        // Sync
        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, view2, card, cardTemplate])))

        const boardTree = await MutableBoardTree.sync(board.id, view.id)
        expect(boardTree).toBeDefined()
        expect(FetchMock.fn).toBeCalledTimes(1)
        const component = wrapIntl(
            <TableHeaderMenu
                templateId={'property 1'}
                boardTree={boardTree!}
            />,
        )
        const {container, getByText} = render(component)

        let sort = getByText(/Sort ascending/i)
        fireEvent.click(sort)
        sort = getByText(/Sort descending/i)
        fireEvent.click(sort)
        expect(mutator.changeViewSortOptions).toHaveBeenCalledTimes(2)

        let insert = getByText(/Insert left/i)
        fireEvent.click(insert)
        insert = getByText(/Insert right/i)
        fireEvent.click(insert)
        expect(mutator.insertPropertyTemplate).toHaveBeenCalledTimes(2)

        const hide = getByText(/Hide/i)
        fireEvent.click(hide)
        expect(mutator.changeViewVisibleProperties).toHaveBeenCalled()
        const duplicate = getByText(/Duplicate/i)
        fireEvent.click(duplicate)
        expect(mutator.duplicatePropertyTemplate).toHaveBeenCalled()
        const del = getByText(/Delete/i)
        fireEvent.click(del)
        expect(mutator.deleteProperty).toHaveBeenCalled()

        expect(container).toMatchSnapshot()
    })
})
