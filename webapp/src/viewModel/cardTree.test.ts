// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Disable console log
console.log = jest.fn()

import 'isomorphic-fetch'
import {IBlock} from '../blocks/block'
import {Card, MutableCard} from '../blocks/card'
import {MutableCommentBlock} from '../blocks/commentBlock'
import {DividerBlock, MutableDividerBlock} from '../blocks/dividerBlock'
import {ImageBlock, MutableImageBlock} from '../blocks/imageBlock'
import {MutableTextBlock, TextBlock} from '../blocks/textBlock'

import {MutableCardTree} from './cardTree'

const fetchMock = jest.fn(async () => {
    const response = new Response()
    return response
})

global.fetch = fetchMock

beforeEach(() => {
    fetchMock.mockReset()
})

test('CardTree: sync', async () => {
    const blocks: IBlock[] = []
    const card = createCard()
    expect(card.id).not.toBeNull()
    blocks.push(card)
    const comment = createComment(card)
    blocks.push(comment)
    const text = createText(card)
    blocks.push(text)
    const image = createImage(card)
    blocks.push(image)
    const divider = createDivider(card)
    blocks.push(divider)

    fetchMock.mockReturnValueOnce(jsonResponse(JSON.stringify(blocks)))
    const cardTree = new MutableCardTree(card.id)
    await cardTree.sync()

    expect(fetchMock).toBeCalledTimes(1)
    expect(cardTree.card).toEqual(card)
    expect(cardTree.comments).toEqual([comment])
    expect(cardTree.contents).toEqual([text, image, divider])

    // Incremental update
    const blocks2: IBlock[] = []
    const comment2 = createComment(card)
    blocks2.push(comment2)
    const text2 = createText(card)
    blocks2.push(text2)
    const image2 = createImage(card)
    blocks2.push(image2)
    const divider2 = createDivider(card)
    blocks2.push(divider2)

    expect(cardTree.incrementalUpdate(blocks2)).toBe(true)
    expect(cardTree.comments).toEqual([comment, comment2])
    expect(cardTree.contents).toEqual([text, image, divider, text2, image2, divider2])

    // Incremental update: No change
    const blocks3: IBlock[] = []
    const comment3 = createComment(card)
    comment3.parentId = 'another parent'
    blocks3.push(comment3)
    expect(cardTree.incrementalUpdate(blocks3)).toBe(false)

    // Copy
    const cardTree2 = cardTree.mutableCopy()
    expect(cardTree2).toEqual(cardTree)
    expect(cardTree2.card).toEqual(cardTree.card)
})

async function jsonResponse(json: string) {
    const response = new Response(json)
    return response
}

function createCard(): Card {
    const card = new MutableCard()
    card.parentId = 'parent'
    card.rootId = 'root'
    card.title = 'title'
    card.icon = 'i'
    card.properties.property1 = 'value1'

    return card
}

function createComment(card: Card): MutableCommentBlock {
    const block = new MutableCommentBlock()
    block.parentId = card.id
    block.rootId = card.rootId
    block.title = 'title'

    return block
}

function createText(card: Card): TextBlock {
    const block = new MutableTextBlock()
    block.parentId = card.id
    block.rootId = card.rootId
    block.title = 'title'
    block.order = 100

    return block
}

function createImage(card: Card): ImageBlock {
    const block = new MutableImageBlock()
    block.parentId = card.id
    block.rootId = card.rootId
    block.url = 'url'
    block.order = 100

    return block
}

function createDivider(card: Card): DividerBlock {
    const block = new MutableDividerBlock()
    block.parentId = card.id
    block.rootId = card.rootId
    block.title = 'title'
    block.order = 100

    return block
}
