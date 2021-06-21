// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {render} from '@testing-library/react'
import '@testing-library/jest-dom'
import {IntlProvider} from 'react-intl'

import 'isomorphic-fetch'

import {DndProvider} from 'react-dnd'
import {HTML5Backend} from 'react-dnd-html5-backend'

import {TestBlockFactory} from '../../test/testBlockFactory'
import {FetchMock} from '../../test/fetchMock'
import {MutableBoardTree} from '../../viewModel/boardTree'

import TableRow from './tableRow'

global.fetch = FetchMock.fn

beforeEach(() => {
    FetchMock.fn.mockReset()
})

const wrapProviders = (children: any) => {
    return (
        <DndProvider backend={HTML5Backend}>
            <IntlProvider locale='en'>{children}</IntlProvider>
        </DndProvider>
    )
}

describe('components/table/TableRow', () => {
    const board = TestBlockFactory.createBoard()
    const view = TestBlockFactory.createBoardView(board)

    const view2 = TestBlockFactory.createBoardView(board)
    view2.sortOptions = []

    const card = TestBlockFactory.createCard(board)
    const cardTemplate = TestBlockFactory.createCard(board)
    cardTemplate.isTemplate = true

    test('should match snapshot', async () => {
        // Sync
        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, view2, card, cardTemplate])))

        const boardTree = await MutableBoardTree.sync(board.id, view.id)
        expect(boardTree).toBeDefined()
        expect(FetchMock.fn).toBeCalledTimes(1)
        const component = wrapProviders(
            <TableRow
                boardTree={boardTree!}
                card={card}
                isSelected={false}
                focusOnMount={false}
                onSaveWithEnter={jest.fn()}
                showCard={jest.fn()}

                readonly={false}
                offset={0}
                resizingColumn={''}
                columnRefs={new Map()}
                onDrop={jest.fn()}
            />,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot, read-only', async () => {
        // Sync
        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, view2, card, cardTemplate])))

        const boardTree = await MutableBoardTree.sync(board.id, view.id)
        expect(boardTree).toBeDefined()
        expect(FetchMock.fn).toBeCalledTimes(1)
        const component = wrapProviders(
            <TableRow
                boardTree={boardTree!}
                card={card}
                isSelected={false}
                focusOnMount={false}
                onSaveWithEnter={jest.fn()}
                showCard={jest.fn()}

                readonly={true}
                offset={0}
                resizingColumn={''}
                columnRefs={new Map()}
                onDrop={jest.fn()}
            />,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot, isSelected', async () => {
        // Sync
        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, view2, card, cardTemplate])))

        const boardTree = await MutableBoardTree.sync(board.id, view.id)
        expect(boardTree).toBeDefined()
        expect(FetchMock.fn).toBeCalledTimes(1)
        const component = wrapProviders(
            <TableRow
                boardTree={boardTree!}
                card={card}
                isSelected={true}
                focusOnMount={false}
                onSaveWithEnter={jest.fn()}
                showCard={jest.fn()}

                readonly={false}
                offset={0}
                resizingColumn={''}
                columnRefs={new Map()}
                onDrop={jest.fn()}
            />,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot, collapsed tree', async () => {
        // Sync
        view.collapsedOptionIds = ['value1']
        view.hiddenOptionIds = []

        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, view2, card, cardTemplate])))

        const boardTree = await MutableBoardTree.sync(board.id, view.id)
        expect(boardTree).toBeDefined()
        expect(FetchMock.fn).toBeCalledTimes(1)
        const component = wrapProviders(
            <TableRow
                boardTree={boardTree!}
                card={card}
                isSelected={false}
                focusOnMount={false}
                onSaveWithEnter={jest.fn()}
                showCard={jest.fn()}

                readonly={false}
                offset={0}
                resizingColumn={''}
                columnRefs={new Map()}
                onDrop={jest.fn()}
            />,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot, display properties', async () => {
        // Sync
        view.visiblePropertyIds = ['property1', 'property2']

        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, view2, card, cardTemplate])))

        const boardTree = await MutableBoardTree.sync(board.id, view.id)
        expect(boardTree).toBeDefined()
        expect(FetchMock.fn).toBeCalledTimes(1)
        const component = wrapProviders(
            <TableRow
                boardTree={boardTree!}
                card={card}
                isSelected={false}
                focusOnMount={false}
                onSaveWithEnter={jest.fn()}
                showCard={jest.fn()}
                readonly={false}
                offset={0}
                resizingColumn={''}
                columnRefs={new Map()}
                onDrop={jest.fn()}
            />,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot, resizing column', async () => {
        // Sync
        view.visiblePropertyIds = ['property1', 'property2']

        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, view2, card, cardTemplate])))

        const boardTree = await MutableBoardTree.sync(board.id, view.id)
        expect(boardTree).toBeDefined()
        expect(FetchMock.fn).toBeCalledTimes(1)
        const component = wrapProviders(
            <TableRow
                boardTree={boardTree!}
                card={card}
                isSelected={false}
                focusOnMount={false}
                onSaveWithEnter={jest.fn()}
                showCard={jest.fn()}
                readonly={false}
                offset={0}
                resizingColumn={'property1'}
                columnRefs={new Map()}
                onDrop={jest.fn()}
            />,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
