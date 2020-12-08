// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Disable console log
console.log = jest.fn()

import 'isomorphic-fetch'
import {TestBlockFactory} from '../test/testBlockFactory'
import {FetchMock} from '../test/fetchMock'

import {MutableCardTree} from './cardTree'

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

    FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([card, comment, text, image, divider])))
    const cardTree = new MutableCardTree(card.id)
    await cardTree.sync()

    expect(FetchMock.fn).toBeCalledTimes(1)
    expect(cardTree.card).toEqual(card)
    expect(cardTree.comments).toEqual([comment])
    expect(cardTree.contents).toEqual([text, image, divider])

    // Incremental update
    const comment2 = TestBlockFactory.createComment(card)
    const text2 = TestBlockFactory.createText(card)
    const image2 = TestBlockFactory.createImage(card)
    const divider2 = TestBlockFactory.createDivider(card)

    expect(cardTree.incrementalUpdate([comment2, text2, image2, divider2])).toBe(true)
    expect(cardTree.comments).toEqual([comment, comment2])
    expect(cardTree.contents).toEqual([text, image, divider, text2, image2, divider2])

    // Incremental update: No change
    const anotherCard = TestBlockFactory.createCard()
    const comment3 = TestBlockFactory.createComment(anotherCard)
    expect(cardTree.incrementalUpdate([comment3])).toBe(false)

    // Copy
    const cardTree2 = cardTree.mutableCopy()
    expect(cardTree2.card).toEqual(cardTree.card)
    expect(cardTree2.comments).toEqual(cardTree.comments)
    expect(cardTree2.contents).toEqual(cardTree.contents)
})
