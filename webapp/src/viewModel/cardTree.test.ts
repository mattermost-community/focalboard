// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Disable console log
console.log = jest.fn()

import 'isomorphic-fetch'
import {TestBlockFactory} from '../test/testBlockFactory'
import {FetchMock} from '../test/fetchMock'

import {CardTree, MutableCardTree} from './cardTree'

global.fetch = FetchMock.fn

beforeEach(() => {
    FetchMock.fn.mockReset()
})

test('CardTree', async () => {
    const card = TestBlockFactory.createCard()
    expect(card.id).not.toBeNull()
    const comment = TestBlockFactory.createComment(card)
    const text = TestBlockFactory.createText(card)
    const image = TestBlockFactory.createImage(card)
    const divider = TestBlockFactory.createDivider(card)

    let cardTree: CardTree | undefined

    FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([card, comment, text, image, divider])))
    cardTree = await MutableCardTree.sync('invalid_id')
    expect(cardTree).toBeUndefined()
    expect(FetchMock.fn).toBeCalledTimes(1)

    FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([card, comment, text, image, divider])))
    cardTree = await MutableCardTree.sync(card.id)
    expect(cardTree).not.toBeUndefined()
    if (!cardTree) {
        fail('sync')
    }

    expect(FetchMock.fn).toBeCalledTimes(2)
    expect(cardTree.card).toEqual(card)
    expect(cardTree.comments).toEqual([comment])
    expect(cardTree.contents).toEqual([text, image, divider])

    // Incremental update
    const comment2 = TestBlockFactory.createComment(card)
    const text2 = TestBlockFactory.createText(card)
    const image2 = TestBlockFactory.createImage(card)
    const divider2 = TestBlockFactory.createDivider(card)

    cardTree = MutableCardTree.incrementalUpdate(cardTree, [comment2, text2, image2, divider2])
    expect(cardTree).not.toBeUndefined()
    if (!cardTree) {
        fail('incrementalUpdate')
    }
    expect(cardTree.comments).toEqual([comment, comment2])
    expect(cardTree.contents).toEqual([text, image, divider, text2, image2, divider2])

    // Incremental update: No change
    const anotherCard = TestBlockFactory.createCard()
    const comment3 = TestBlockFactory.createComment(anotherCard)
    const originalCardTree = cardTree
    cardTree = MutableCardTree.incrementalUpdate(cardTree, [comment3])
    expect(cardTree).toBe(originalCardTree)
    expect(cardTree).not.toBeUndefined()
    if (!cardTree) {
        fail('incrementalUpdate')
    }

    // Copy
    // const cardTree2 = cardTree.mutableCopy()
    // expect(cardTree2.card).toEqual(cardTree.card)
    // expect(cardTree2.comments).toEqual(cardTree.comments)
    // expect(cardTree2.contents).toEqual(cardTree.contents)
})
