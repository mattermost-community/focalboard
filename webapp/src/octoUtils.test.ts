// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Block} from './blocks/block'
import {OctoUtils} from './octoUtils'

import {TestBlockFactory} from './test/testBlockFactory'

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
