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
})
