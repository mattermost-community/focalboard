// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Disable console log
console.log = jest.fn()
console.error = jest.fn()

import 'isomorphic-fetch'
import {TestBlockFactory} from '../test/testBlockFactory'
import {FetchMock} from '../test/fetchMock'

import {MutableBoardTree} from './boardTree'

global.fetch = FetchMock.fn

beforeEach(() => {
    FetchMock.fn.mockReset()
})

test('BoardTree', async () => {
    const board = TestBlockFactory.createBoard()
    const view = TestBlockFactory.createBoardView(board)

    const view2 = TestBlockFactory.createBoardView(board)
    view2.sortOptions = []

    const card = TestBlockFactory.createCard(board)
    const cardTemplate = TestBlockFactory.createCard(board)
    cardTemplate.isTemplate = true

    // Sync
    FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, view2, card, cardTemplate])))
    let boardTree = await MutableBoardTree.sync(board.id, view.id)
    expect(boardTree).not.toBeUndefined()
    if (!boardTree) {
        fail('sync')
    }
    expect(FetchMock.fn).toBeCalledTimes(1)
    expect(boardTree.board).toEqual(board)
    expect(boardTree.views).toEqual([view, view2])
    expect(boardTree.allCards).toEqual([card])
    expect(boardTree.cardTemplates).toEqual([cardTemplate])
    expect(boardTree.allBlocks).toEqual([board, view, view2, card, cardTemplate])

    // Group / filter with sort
    expect(boardTree.activeView).toEqual(view)
    expect(boardTree.cards).toEqual([card])

    // Group / filter without sort
    boardTree = boardTree.copyWithView(view2.id)
    expect(boardTree.activeView).toEqual(view2)
    expect(boardTree.cards).toEqual([card])

    // Invalid view, defaults to first view
    boardTree = boardTree.copyWithView('invalid id')
    expect(boardTree.activeView).toEqual(view)

    // Incremental update
    const view3 = TestBlockFactory.createBoardView(board)
    const card2 = TestBlockFactory.createCard(board)
    const cardTemplate2 = TestBlockFactory.createCard(board)
    cardTemplate2.isTemplate = true

    let originalBoardTree = boardTree
    boardTree = MutableBoardTree.incrementalUpdate(boardTree, [view3, card2, cardTemplate2])
    expect(boardTree).not.toBe(originalBoardTree)
    expect(boardTree).not.toBeUndefined()
    if (!boardTree) {
        fail('incrementalUpdate')
    }
    expect(boardTree.views).toEqual([view, view2, view3])
    expect(boardTree.allCards).toEqual([card, card2])
    expect(boardTree.cardTemplates).toEqual([cardTemplate, cardTemplate2])

    // Group / filter with sort
    originalBoardTree = boardTree
    boardTree = boardTree.copyWithView(view.id)
    expect(boardTree).not.toBe(originalBoardTree)
    expect(boardTree.activeView).toEqual(view)
    expect(boardTree.cards).toEqual([card, card2])

    // Group / filter without sort
    originalBoardTree = boardTree
    boardTree = boardTree.copyWithView(view2.id)
    expect(boardTree).not.toBe(originalBoardTree)
    expect(boardTree.activeView).toEqual(view2)
    expect(boardTree.cards).toEqual([card, card2])

    // Incremental update: No change
    const anotherBoard = TestBlockFactory.createBoard()
    const card4 = TestBlockFactory.createCard(anotherBoard)
    originalBoardTree = boardTree
    boardTree = MutableBoardTree.incrementalUpdate(boardTree, [anotherBoard, card4])
    expect(boardTree).toBe(originalBoardTree) // Expect same value on no change
    expect(boardTree).not.toBeUndefined()
    if (!boardTree) {
        fail('incrementalUpdate')
    }

    // Copy
    // const boardTree2 = boardTree.mutableCopy()
    // expect(boardTree2.board).toEqual(boardTree.board)
    // expect(boardTree2.views).toEqual(boardTree.views)
    // expect(boardTree2.allCards).toEqual(boardTree.allCards)
    // expect(boardTree2.cardTemplates).toEqual(boardTree.cardTemplates)
    // expect(boardTree2.allBlocks).toEqual(boardTree.allBlocks)

    // Search text
    const searchText = 'search text'
    expect(boardTree.getSearchText()).toBeUndefined()
    boardTree = boardTree.copyWithSearchText(searchText)
    expect(boardTree.getSearchText()).toBe(searchText)
})

test('BoardTree: defaults', async () => {
    const board = TestBlockFactory.createBoard()
    board.cardProperties = []

    // Sync
    FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board])))
    const boardTree = await MutableBoardTree.sync(board.id, 'noView')
    expect(boardTree).not.toBeUndefined()
    if (!boardTree) {
        fail('sync')
    }

    expect(FetchMock.fn).toBeCalledTimes(1)
    expect(boardTree.board).not.toBeUndefined()
    expect(boardTree.activeView).not.toBeUndefined()
    expect(boardTree.views.length).toEqual(1)
    expect(boardTree.allCards).toEqual([])
    expect(boardTree.cardTemplates).toEqual([])

    // Match everything except for cardProperties
    board.cardProperties = boardTree.board!.cardProperties.slice()
    expect(boardTree.board).toEqual(board)
})
