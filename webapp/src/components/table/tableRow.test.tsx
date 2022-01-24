// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'
import {render} from '@testing-library/react'
import configureStore from 'redux-mock-store'

import '@testing-library/jest-dom'
import {wrapDNDIntl} from '../../testUtils'

import 'isomorphic-fetch'

import {TestBlockFactory} from '../../test/testBlockFactory'

import TableRow from './tableRow'

describe('components/table/TableRow', () => {
    const board = TestBlockFactory.createBoard()
    const view = TestBlockFactory.createBoardView(board)

    const view2 = TestBlockFactory.createBoardView(board)
    view2.fields.sortOptions = []

    const card = TestBlockFactory.createCard(board)
    const cardTemplate = TestBlockFactory.createCard(board)
    cardTemplate.fields.isTemplate = true

    const state = {
        users: {},
        comments: {
            comments: {},
        },
        contents: {
            contents: {},
        },
        cards: {
            cards: {
                [card.id]: card,
            },
        },
    }

    const mockStore = configureStore([])

    test('should match snapshot', async () => {
        const store = mockStore(state)
        const component = wrapDNDIntl(
            <ReduxProvider store={store}>
                <TableRow
                    board={board}
                    activeView={view}
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
                />
            </ReduxProvider>,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot, read-only', async () => {
        const store = mockStore(state)
        const component = wrapDNDIntl(
            <ReduxProvider store={store}>
                <TableRow
                    board={board}
                    card={card}
                    activeView={view}
                    isSelected={false}
                    focusOnMount={false}
                    onSaveWithEnter={jest.fn()}
                    showCard={jest.fn()}

                    readonly={true}
                    offset={0}
                    resizingColumn={''}
                    columnRefs={new Map()}
                    onDrop={jest.fn()}
                />
            </ReduxProvider>,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot, isSelected', async () => {
        const store = mockStore(state)
        const component = wrapDNDIntl(
            <ReduxProvider store={store}>
                <TableRow
                    board={board}
                    card={card}
                    activeView={view}
                    isSelected={true}
                    focusOnMount={false}
                    onSaveWithEnter={jest.fn()}
                    showCard={jest.fn()}

                    readonly={false}
                    offset={0}
                    resizingColumn={''}
                    columnRefs={new Map()}
                    onDrop={jest.fn()}
                />
            </ReduxProvider>,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot, collapsed tree', async () => {
        view.fields.collapsedOptionIds = ['value1']
        view.fields.hiddenOptionIds = []

        const store = mockStore(state)
        const component = wrapDNDIntl(
            <ReduxProvider store={store}>
                <TableRow
                    board={board}
                    card={card}
                    activeView={view}
                    isSelected={false}
                    focusOnMount={false}
                    onSaveWithEnter={jest.fn()}
                    showCard={jest.fn()}

                    readonly={false}
                    offset={0}
                    resizingColumn={''}
                    columnRefs={new Map()}
                    onDrop={jest.fn()}
                />
            </ReduxProvider>,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot, display properties', async () => {
        view.fields.visiblePropertyIds = ['property1', 'property2']

        const store = mockStore(state)
        const component = wrapDNDIntl(
            <ReduxProvider store={store}>
                <TableRow
                    board={board}
                    card={card}
                    activeView={view}
                    isSelected={false}
                    focusOnMount={false}
                    onSaveWithEnter={jest.fn()}
                    showCard={jest.fn()}
                    readonly={false}
                    offset={0}
                    resizingColumn={''}
                    columnRefs={new Map()}
                    onDrop={jest.fn()}
                />
            </ReduxProvider>,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot, resizing column', async () => {
        view.fields.visiblePropertyIds = ['property1', 'property2']

        const store = mockStore(state)
        const component = wrapDNDIntl(
            <ReduxProvider store={store}>
                <TableRow
                    board={board}
                    card={card}
                    activeView={view}
                    isSelected={false}
                    focusOnMount={false}
                    onSaveWithEnter={jest.fn()}
                    showCard={jest.fn()}
                    readonly={false}
                    offset={0}
                    resizingColumn={'property1'}
                    columnRefs={new Map()}
                    onDrop={jest.fn()}
                />
            </ReduxProvider>,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
