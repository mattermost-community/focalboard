// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Block} from './blocks/block'
import {OctoUtils} from './octoUtils'

import {TestBlockFactory} from './test/testBlockFactory'

// ToDo: we need a way to duplicate the board first creating a new
// board and then dupliating and inserting all its blocks
// test('duplicateBlockTree: Board', async () => {
//     const [blocks, board] = createBoardTree()
//
//     const [newBlocks, newBoard, idMap] = OctoUtils.duplicateBlockTree(blocks, board.id)
//
//     expect(newBlocks.length).toBe(blocks.length)
//     expect(newSourceBlock.id).not.toBe(sourceBlock)
//     expect(newSourceBlock.type).toBe(sourceBlock.type)
//
//     // When duplicating a root block, the boardId should be re-mapped
//     expect(newSourceBlock.boardId).not.toBe(sourceBlock.boardId)
//     expect(idMap[sourceBlock.id]).toBe(newSourceBlock.id)
//
//     for (const newBlock of newBlocks) {
//         expect(newBlock.boardId).toBe(newSourceBlock.id)
//     }
//
//     for (const textBlock of newBlocks.filter((o) => o.type === 'card')) {
//         expect(textBlock.parentId).toBe(newSourceBlock.id)
//     }
// })

test('duplicateBlockTree: Card', async () => {
    const [blocks, sourceBlock] = createCardTree()

    const [newBlocks, newSourceBlock, idMap] = OctoUtils.duplicateBlockTree(blocks, sourceBlock.id)

    expect(newBlocks.length).toBe(blocks.length)
    expect(newSourceBlock.id).not.toBe(sourceBlock.id)
    expect(newSourceBlock.type).toBe(sourceBlock.type)

    // When duplicating a non-root block, the boardId should not be re-mapped
    expect(newSourceBlock.boardId).toBe(sourceBlock.boardId)
    expect(idMap[sourceBlock.id]).toBe(newSourceBlock.id)

    for (const newBlock of newBlocks) {
        expect(newBlock.boardId).toBe(newSourceBlock.boardId)
    }

    for (const textBlock of newBlocks.filter((o) => o.type === 'text')) {
        expect(textBlock.parentId).toBe(newSourceBlock.id)
    }
})

// function createBoardTree(): [Block[], Board] {
//     const blocks: Block[] = []

//     const board = TestBlockFactory.createBoard()
//     board.id = 'board1'

//     for (let i = 0; i < 5; i++) {
//         const card = TestBlockFactory.createCard(board)
//         card.id = `card${i}`
//         blocks.push(card)

//         for (let j = 0; j < 3; j++) {
//             const textBlock = TestBlockFactory.createText(card)
//             textBlock.id = `text${j}`
//             blocks.push(textBlock)
//         }
//     }

//     return [blocks, board]
// }

function createCardTree(): [Block[], Block] {
    const blocks: Block[] = []

    const card = TestBlockFactory.createCard()
    card.id = 'card1'
    card.boardId = 'board1'
    blocks.push(card)

    for (let i = 0; i < 5; i++) {
        const textBlock = TestBlockFactory.createText(card)
        textBlock.id = `text${i}`
        blocks.push(textBlock)
    }

    return [blocks, card]
}
