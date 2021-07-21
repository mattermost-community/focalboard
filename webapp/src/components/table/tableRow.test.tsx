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

import TableRow from './tableRow'

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
    view2.fields.sortOptions = []

    const card = TestBlockFactory.createCard(board)
    const cardTemplate = TestBlockFactory.createCard(board)
    cardTemplate.fields.isTemplate = true

    test('should match snapshot', async () => {
        const component = wrapProviders(
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
            />,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot, read-only', async () => {
        const component = wrapProviders(
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
            />,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot, isSelected', async () => {
        const component = wrapProviders(
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
            />,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot, collapsed tree', async () => {
        // Sync
        view.fields.collapsedOptionIds = ['value1']
        view.fields.hiddenOptionIds = []

        const component = wrapProviders(
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
            />,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot, display properties', async () => {
        view.fields.visiblePropertyIds = ['property1', 'property2']

        const component = wrapProviders(
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
            />,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot, resizing column', async () => {
        view.fields.visiblePropertyIds = ['property1', 'property2']

        const component = wrapProviders(
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
            />,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
