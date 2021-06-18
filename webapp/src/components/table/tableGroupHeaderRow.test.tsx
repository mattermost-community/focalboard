// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {fireEvent, render} from '@testing-library/react'
import '@testing-library/jest-dom'
import {IntlProvider} from 'react-intl'

import 'isomorphic-fetch'

import {DndProvider} from 'react-dnd'
import {HTML5Backend} from 'react-dnd-html5-backend'

import {act} from 'react-dom/test-utils'

import userEvent from '@testing-library/user-event'

import {TestBlockFactory} from '../../test/testBlockFactory'
import {FetchMock} from '../../test/fetchMock'
import {MutableBoardTree} from '../../viewModel/boardTree'

import TableGroupHeaderRowElement from './tableGroupHeaderRow'

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

const board = TestBlockFactory.createBoard()
const view = TestBlockFactory.createBoardView(board)

const view2 = TestBlockFactory.createBoardView(board)
view2.sortOptions = []

const card = TestBlockFactory.createCard(board)
const cardTemplate = TestBlockFactory.createCard(board)
cardTemplate.isTemplate = true

const boardTreeNoGroup = {
    option: {
        id: '',
        value: '',
        color: 'color1',
    },
    cards: [],
}

const boardTreeGroup = {
    option: {
        id: 'value1',
        value: 'value 1',
        color: 'color1',
    },
    cards: [],
}

test('should match snapshot, no groups', async () => {
    // Sync
    FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, view2, card, cardTemplate])))
    const boardTree = await MutableBoardTree.sync(board.id, view.id)
    expect(boardTree).toBeDefined()
    expect(FetchMock.fn).toBeCalledTimes(1)

    const component = wrapProviders(
        <TableGroupHeaderRowElement
            boardTree={boardTree!}
            group={boardTreeNoGroup}
            readonly={false}
            hideGroup={jest.fn()}
            addCard={jest.fn()}
            propertyNameChanged={jest.fn()}
            onDrop={jest.fn()}
        />,
    )
    const {container} = render(component)
    expect(container).toMatchSnapshot()
})

test('should match snapshot with Group', async () => {
    // Sync
    FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, view2, card, cardTemplate])))

    const boardTree = await MutableBoardTree.sync(board.id, view.id)
    expect(boardTree).toBeDefined()
    expect(FetchMock.fn).toBeCalledTimes(1)

    const component = wrapProviders(
        <TableGroupHeaderRowElement
            boardTree={boardTree!}
            group={boardTreeGroup}
            readonly={false}
            hideGroup={jest.fn()}
            addCard={jest.fn()}
            propertyNameChanged={jest.fn()}
            onDrop={jest.fn()}
        />,
    )
    const {container} = render(component)
    expect(container).toMatchSnapshot()
})

test('should match snapshot on read only', async () => {
    // Sync
    FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, view2, card, cardTemplate])))

    const boardTree = await MutableBoardTree.sync(board.id, view.id)
    expect(boardTree).toBeDefined()
    expect(FetchMock.fn).toBeCalledTimes(1)

    const component = wrapProviders(
        <TableGroupHeaderRowElement
            boardTree={boardTree!}
            group={boardTreeGroup}
            readonly={true}
            hideGroup={jest.fn()}
            addCard={jest.fn()}
            propertyNameChanged={jest.fn()}
            onDrop={jest.fn()}
        />,
    )
    const {container} = render(component)
    expect(container).toMatchSnapshot()
})

test('should match snapshot, hide group', async () => {
    // Sync
    FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, view2, card, cardTemplate])))

    const hideGroup = jest.fn()

    view.collapsedOptionIds = [boardTreeGroup.option.id]
    const boardTree = await MutableBoardTree.sync(board.id, view.id)
    expect(boardTree).toBeDefined()
    expect(FetchMock.fn).toBeCalledTimes(1)

    const component = wrapProviders(
        <TableGroupHeaderRowElement
            boardTree={boardTree!}
            group={boardTreeGroup}
            readonly={false}
            hideGroup={hideGroup}
            addCard={jest.fn()}
            propertyNameChanged={jest.fn()}
            onDrop={jest.fn()}
        />,
    )

    const {container} = render(component)
    const triangle = container.querySelector('svg.DisclosureTriangleIcon')
    expect(triangle).not.toBeNull()

    act(() => {
        fireEvent.click(triangle as Element)
    })
    expect(hideGroup).toBeCalled()
    expect(container).toMatchSnapshot()
})

test('should match snapshot, add new', async () => {
    // Sync
    FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, view2, card, cardTemplate])))

    const addNew = jest.fn()

    const boardTree = await MutableBoardTree.sync(board.id, view.id)
    expect(boardTree).toBeDefined()
    expect(FetchMock.fn).toBeCalledTimes(1)

    const component = wrapProviders(
        <TableGroupHeaderRowElement
            boardTree={boardTree!}
            group={boardTreeGroup}
            readonly={false}
            hideGroup={jest.fn()}
            addCard={addNew}
            propertyNameChanged={jest.fn()}
            onDrop={jest.fn()}
        />,
    )

    const {container} = render(component)

    const triangle = container.querySelector('i.AddIcon')
    expect(triangle).not.toBeNull()

    act(() => {
        fireEvent.click(triangle as Element)
    })
    expect(addNew).toBeCalled()
    expect(container).toMatchSnapshot()
})

test('should match snapshot, edit title', async () => {
    // Sync
    FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, view2, card, cardTemplate])))

    const boardTree = await MutableBoardTree.sync(board.id, view.id)
    expect(boardTree).toBeDefined()
    expect(FetchMock.fn).toBeCalledTimes(1)

    const component = wrapProviders(
        <TableGroupHeaderRowElement
            boardTree={boardTree!}
            group={boardTreeGroup}
            readonly={false}
            hideGroup={jest.fn()}
            addCard={jest.fn()}
            propertyNameChanged={jest.fn()}
            onDrop={jest.fn()}
        />,
    )

    const {container, getByTitle} = render(component)
    const input = getByTitle(/value 1/)
    act(() => {
        userEvent.click(input)
        userEvent.keyboard('{enter}')
    })

    expect(container).toMatchSnapshot()
})
