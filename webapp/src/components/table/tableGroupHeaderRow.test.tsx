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

import TableGroupHeaderRowElement from './tableGroupHeaderRow'

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
view2.fields.sortOptions = []

const boardTreeNoGroup = {
    option: {
        id: '',
        value: '',
        color: 'propColorBrown',
    },
    cards: [],
}

const boardTreeGroup = {
    option: {
        id: 'value1',
        value: 'value 1',
        color: 'propColorBrown',
    },
    cards: [],
}

test('should match snapshot, no groups', async () => {
    const component = wrapProviders(
        <TableGroupHeaderRowElement
            board={board}
            activeView={view}
            group={boardTreeNoGroup}
            readonly={false}
            hideGroup={jest.fn()}
            addCard={jest.fn()}
            propertyNameChanged={jest.fn()}
            onDrop={jest.fn()}
            groupByProperty={{
                id: '',
                name: 'Property 1',
                type: 'text',
                options: [{id: 'property1', value: 'Property 1', color: ''}],
            }}
        />,
    )
    const {container} = render(component)
    expect(container).toMatchSnapshot()
})

test('should match snapshot with Group', async () => {
    const component = wrapProviders(
        <TableGroupHeaderRowElement
            board={board}
            activeView={view}
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
    const component = wrapProviders(
        <TableGroupHeaderRowElement
            board={board}
            activeView={view}
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
    const hideGroup = jest.fn()

    const collapsedOptionsView = TestBlockFactory.createBoardView(board)
    collapsedOptionsView.fields.collapsedOptionIds = [boardTreeGroup.option.id]

    const component = wrapProviders(
        <TableGroupHeaderRowElement
            board={board}
            activeView={collapsedOptionsView}
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
    const addNew = jest.fn()

    const component = wrapProviders(
        <TableGroupHeaderRowElement
            board={board}
            activeView={view}
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
    const component = wrapProviders(
        <TableGroupHeaderRowElement
            board={board}
            activeView={view}
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
