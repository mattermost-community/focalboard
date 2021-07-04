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

import Table from './table'

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

describe('components/table/Table', () => {
    const board = TestBlockFactory.createBoard()
    const view = TestBlockFactory.createBoardView(board)
    view.viewType = 'table'
    view.groupById = undefined
    view.visiblePropertyIds = ['property1', 'property2']

    const view2 = TestBlockFactory.createBoardView(board)
    view2.sortOptions = []

    const card = TestBlockFactory.createCard(board)
    const cardTemplate = TestBlockFactory.createCard(board)
    cardTemplate.isTemplate = true

    test('should match snapshot', async () => {
        // Sync
        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, view2, card, cardTemplate])))

        const boardTree = await MutableBoardTree.sync(board.id, view.id)
        expect(boardTree).not.toBeUndefined()
        if (!boardTree) {
            fail('sync')
        }

        expect(FetchMock.fn).toBeCalledTimes(1)
        expect(boardTree.cards).toBeDefined()
        expect(boardTree.cards).toEqual([card])

        const callback = jest.fn()
        const addCard = jest.fn()

        const component = wrapProviders(
            <Table
                boardTree={boardTree!}
                selectedCardIds={[]}
                readonly={false}
                cardIdToFocusOnRender=''
                showCard={callback}
                addCard={addCard}
                onCardClicked={jest.fn()}
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

        const callback = jest.fn()
        const addCard = jest.fn()

        const component = wrapProviders(
            <Table
                boardTree={boardTree!}
                selectedCardIds={[]}
                readonly={true}
                cardIdToFocusOnRender=''
                showCard={callback}
                addCard={addCard}
                onCardClicked={jest.fn()}
            />,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot with GroupBy', async () => {
        // Sync
        view.groupById = 'property1'
        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, view2, card, cardTemplate])))

        const boardTree = await MutableBoardTree.sync(board.id, view.id)
        expect(boardTree).not.toBeUndefined()
        if (!boardTree) {
            fail('sync')
        }

        expect(FetchMock.fn).toBeCalledTimes(1)
        expect(boardTree.cards).toBeDefined()
        expect(boardTree.cards).toEqual([card])

        const callback = jest.fn()
        const addCard = jest.fn()

        const component = wrapProviders(
            <Table
                boardTree={boardTree!}
                selectedCardIds={[]}
                readonly={false}
                cardIdToFocusOnRender=''
                showCard={callback}
                addCard={addCard}
                onCardClicked={jest.fn()}
            />,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
