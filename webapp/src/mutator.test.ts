// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import mutator from './mutator'
import {TestBlockFactory} from './test/testBlockFactory'
import 'isomorphic-fetch'
import {FetchMock} from './test/fetchMock'
import {mockDOM} from './testUtils'

global.fetch = FetchMock.fn

beforeEach(() => {
    FetchMock.fn.mockReset()
})

beforeAll(() => {
    mockDOM()
})

describe('Mutator', () => {
    test('changePropertyValue', async () => {
        const card = TestBlockFactory.createCard()
        card.fields.properties.property_1 = 'hello'

        await mutator.changePropertyValue(card, 'property_1', 'hello')

        // No API call should be made as property value DIDN'T CHANGE
        expect(FetchMock.fn).toBeCalledTimes(0)

        await mutator.changePropertyValue(card, 'property_1', 'hello world')

        // 1 API call should be made as property value DID CHANGE
        expect(FetchMock.fn).toBeCalledTimes(1)
    })

    test('duplicateCard', async () => {
        const card = TestBlockFactory.createCard()
        const board = TestBlockFactory.createBoard()

        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([card])))
        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([])))
        const [newBlocks, newCardID] = await mutator.duplicateCard(card.id, board)

        expect(newBlocks).toHaveLength(1)

        const duplicatedCard = newBlocks[0]
        expect(duplicatedCard.type).toBe('card')
        expect(duplicatedCard.id).toBe(newCardID)
        expect(duplicatedCard.fields.icon).toBe(card.fields.icon)
        expect(duplicatedCard.fields.contentOrder).toHaveLength(card.fields.contentOrder.length)
        expect(duplicatedCard.parentId).toBe(board.id)
        expect(duplicatedCard.rootId).toBe(board.id)
    })
})
