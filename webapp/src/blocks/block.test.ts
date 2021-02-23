// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {TestBlockFactory} from '../test/testBlockFactory'

import {MutableBoard} from './board'
import {MutableBoardView} from './boardView'
import {MutableCard} from './card'
import {MutableCommentBlock} from './commentBlock'
import {MutableDividerBlock} from './dividerBlock'
import {MutableImageBlock} from './imageBlock'
import {MutableTextBlock} from './textBlock'

test('block: clone board', async () => {
    const boardA = TestBlockFactory.createBoard()
    boardA.isTemplate = true
    const boardB = new MutableBoard(boardA)

    expect(boardB).toEqual(boardA)

    expect(boardB.icon).toBe(boardA.icon)
    expect(boardB.isTemplate).toBe(boardA.isTemplate)
    expect(boardB.description).toBe(boardA.description)
    expect(boardB.showDescription).toBe(boardA.showDescription)
})

test('block: clone view', async () => {
    const viewA = TestBlockFactory.createBoardView()
    const viewB = new MutableBoardView(viewA)

    expect(viewB).toEqual(viewA)
    expect(viewB.groupById).toBe(viewA.groupById)
    expect(viewB.hiddenOptionIds).toEqual(viewA.hiddenOptionIds)
    expect(viewB.visiblePropertyIds).toEqual(viewA.visiblePropertyIds)
    expect(viewB.visibleOptionIds).toEqual(viewA.visibleOptionIds)
    expect(viewB.filter).toEqual(viewA.filter)
    expect(viewB.sortOptions).toEqual(viewA.sortOptions)
    expect(viewB.cardOrder).toEqual(viewA.cardOrder)
    expect(viewB.columnWidths).toEqual(viewA.columnWidths)
})

test('block: clone card', async () => {
    const cardA = TestBlockFactory.createCard()
    cardA.isTemplate = true
    const cardB = new MutableCard(cardA)

    expect(cardB).toEqual(cardA)
    expect(cardB.icon).toBe(cardA.icon)
    expect(cardB.isTemplate).toBe(cardA.isTemplate)
    expect(cardB.contentOrder).toEqual(cardA.contentOrder)
})

test('block: clone comment', async () => {
    const card = TestBlockFactory.createCard()
    const blockA = TestBlockFactory.createComment(card)
    const blockB = new MutableCommentBlock(blockA)

    expect(blockB).toEqual(blockA)
})

test('block: clone text', async () => {
    const card = TestBlockFactory.createCard()
    const blockA = TestBlockFactory.createText(card)
    const blockB = new MutableTextBlock(blockA)

    expect(blockB).toEqual(blockA)
})

test('block: clone image', async () => {
    const card = TestBlockFactory.createCard()
    const blockA = TestBlockFactory.createImage(card)
    const blockB = new MutableImageBlock(blockA)

    expect(blockB).toEqual(blockA)
    expect(blockB.fileId.length).toBeGreaterThan(0)
    expect(blockB.fileId).toEqual(blockA.fileId)
})

test('block: clone divider', async () => {
    const card = TestBlockFactory.createCard()
    const blockA = TestBlockFactory.createDivider(card)
    const blockB = new MutableDividerBlock(blockA)

    expect(blockB).toEqual(blockA)
})
