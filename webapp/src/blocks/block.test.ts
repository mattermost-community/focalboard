// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {FilterClause} from '../filterClause'
import {FilterGroup} from '../filterGroup'
import {Utils} from '../utils'

import {Board, IPropertyOption, IPropertyTemplate, MutableBoard} from './board'
import {BoardView, MutableBoardView} from './boardView'
import {Card, MutableCard} from './card'
import {CommentBlock, MutableCommentBlock} from './commentBlock'
import {DividerBlock, MutableDividerBlock} from './dividerBlock'
import {ImageBlock, MutableImageBlock} from './imageBlock'
import {MutableTextBlock, TextBlock} from './textBlock'

test('block: clone board', async () => {
    const boardA = createBoardTemplate()
    const boardB = new MutableBoard(boardA)

    expect(boardB).toEqual(boardA)

    expect(boardB.icon).toBe(boardA.icon)
    expect(boardB.isTemplate).toBe(boardA.isTemplate)
    expect(boardB.description).toBe(boardA.description)
    expect(boardB.showDescription).toBe(boardA.showDescription)
})

test('block: clone view', async () => {
    const viewA = createBoardView()
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
    const cardA = createCardTemplate()
    const cardB = new MutableCard(cardA)

    expect(cardB).toEqual(cardA)
    expect(cardB.icon).toBe(cardA.icon)
    expect(cardB.isTemplate).toBe(cardA.isTemplate)
})

test('block: clone comment', async () => {
    const blockA = createComment()
    const blockB = new MutableCommentBlock(blockA)

    expect(blockB).toEqual(blockA)
})

test('block: clone text', async () => {
    const blockA = createText()
    const blockB = new MutableTextBlock(blockA)

    expect(blockB).toEqual(blockA)
    expect(blockB.order).toEqual(blockA.order)
})

test('block: clone image', async () => {
    const blockA = createImage()
    const blockB = new MutableImageBlock(blockA)

    expect(blockB).toEqual(blockA)
    expect(blockB.order).toEqual(blockA.order)
    expect(blockB.url.length).toBeGreaterThan(0)
    expect(blockB.url).toEqual(blockA.url)
})

test('block: clone divider', async () => {
    const blockA = createDivider()
    const blockB = new MutableDividerBlock(blockA)

    expect(blockB).toEqual(blockA)
    expect(blockB.order).toEqual(blockA.order)
})

function createBoardTemplate(): Board {
    const board = new MutableBoard()
    board.parentId = 'parent'
    board.rootId = 'root'
    board.title = 'title'
    board.description = 'description'
    board.showDescription = true
    board.icon = 'i'

    for (let i = 0; i < 5; i++) {
        const propertyOption: IPropertyOption = {
            id: 'property1',
            value: 'value1',
            color: 'color1',
        }
        const propertyTemplate: IPropertyTemplate = {
            id: Utils.createGuid(),
            name: 'Status',
            type: 'select',
            options: [propertyOption],
        }
        board.cardProperties.push(propertyTemplate)
    }
    board.isTemplate = true

    return board
}

function createBoardView(): BoardView {
    const view = new MutableBoardView()
    view.parentId = 'parent'
    view.rootId = 'root'
    view.title = 'title'
    view.viewType = 'board'
    view.groupById = 'groupId'
    view.hiddenOptionIds = ['option1', 'option2', 'option3']
    view.cardOrder = ['card1', 'card2', 'card3']
    view.sortOptions = [
        {
            propertyId: 'property1',
            reversed: true,
        },
        {
            propertyId: 'property2',
            reversed: false,
        },
    ]
    view.columnWidths = {
        column1: 100,
        column2: 200,
    }

    // Filter
    const filterGroup = new FilterGroup()
    const filter = new FilterClause()
    filter.propertyId = 'property1'
    filter.condition = 'includes'
    filter.values = ['value1']
    filterGroup.filters.push(filter)
    view.filter = filterGroup

    return view
}

function createCardTemplate(): Card {
    const card = new MutableCard()
    card.parentId = 'parent'
    card.rootId = 'root'
    card.title = 'title'
    card.icon = 'i'
    card.properties.property1 = 'value1'
    card.isTemplate = true

    return card
}

function createComment(): CommentBlock {
    const block = new MutableCommentBlock()
    block.parentId = 'parent'
    block.rootId = 'root'
    block.title = 'title'

    return block
}

function createText(): TextBlock {
    const block = new MutableTextBlock()
    block.parentId = 'parent'
    block.rootId = 'root'
    block.title = 'title'
    block.order = 100

    return block
}

function createImage(): ImageBlock {
    const block = new MutableImageBlock()
    block.parentId = 'parent'
    block.rootId = 'root'
    block.url = 'url'
    block.order = 100

    return block
}

function createDivider(): DividerBlock {
    const block = new MutableDividerBlock()
    block.parentId = 'parent'
    block.rootId = 'root'
    block.title = 'title'
    block.order = 100

    return block
}
