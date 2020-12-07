// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {IBlock} from './blocks/block'
import {MutableBoard} from './blocks/board'
import {MutableCard} from './blocks/card'
import {MutableTextBlock} from './blocks/textBlock'
import {OctoUtils} from './octoUtils'

test('duplicateBlockTree: Board', async () => {
    const [blocks, sourceBlock] = createBoardTree()

    const [newBlocks, newSourceBlock, idMap] = OctoUtils.duplicateBlockTree(blocks, sourceBlock.id)

    expect(newBlocks.length).toBe(blocks.length)
    expect(newSourceBlock.id).not.toBe(sourceBlock)
    expect(newSourceBlock.type).toBe(sourceBlock.type)

    // When duplicating a root block, the rootId should be re-mapped
    expect(newSourceBlock.rootId).not.toBe(sourceBlock.rootId)
    expect(idMap[sourceBlock.id]).toBe(newSourceBlock.id)

    for (const newBlock of newBlocks) {
        expect(newBlock.rootId).toBe(newSourceBlock.id)
    }

    for (const textBlock of newBlocks.filter((o) => o.type === 'card')) {
        expect(textBlock.parentId).toBe(newSourceBlock.id)
    }
})

test('duplicateBlockTree: Card', async () => {
    const [blocks, sourceBlock] = createCardTree()

    const [newBlocks, newSourceBlock, idMap] = OctoUtils.duplicateBlockTree(blocks, sourceBlock.id)

    expect(newBlocks.length).toBe(blocks.length)
    expect(newSourceBlock.id).not.toBe(sourceBlock.id)
    expect(newSourceBlock.type).toBe(sourceBlock.type)

    // When duplicating a non-root block, the rootId should not be re-mapped
    expect(newSourceBlock.rootId).toBe(sourceBlock.rootId)
    expect(idMap[sourceBlock.id]).toBe(newSourceBlock.id)

    for (const newBlock of newBlocks) {
        expect(newBlock.rootId).toBe(newSourceBlock.rootId)
    }

    for (const textBlock of newBlocks.filter((o) => o.type === 'text')) {
        expect(textBlock.parentId).toBe(newSourceBlock.id)
    }
})

function createBoardTree(): [IBlock[], IBlock] {
    const blocks: IBlock[] = []

    const board = new MutableBoard()
    board.id = 'board1'
    board.rootId = board.id
    blocks.push(board)

    for (let i = 0; i < 5; i++) {
        const card = new MutableCard()
        card.id = `card${i}`
        card.parentId = board.id
        card.rootId = board.id
        blocks.push(card)

        for (let j = 0; j < 3; j++) {
            const textBlock = new MutableTextBlock()
            textBlock.id = `text${j}`
            textBlock.parentId = card.id
            textBlock.rootId = card.rootId
            blocks.push(textBlock)
        }
    }

    return [blocks, board]
}

function createCardTree(): [IBlock[], IBlock] {
    const blocks: IBlock[] = []

    const card = new MutableCard()
    card.id = 'card1'
    card.rootId = 'board1'
    blocks.push(card)

    for (let i = 0; i < 5; i++) {
        const textBlock = new MutableTextBlock()
        textBlock.id = `text${i}`
        textBlock.parentId = card.id
        textBlock.rootId = card.rootId
        blocks.push(textBlock)
    }

    return [blocks, card]
}
