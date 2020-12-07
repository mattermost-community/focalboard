// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Disable console log
console.log = jest.fn()

import 'isomorphic-fetch'
import {TestBlockFactory} from '../test/block'

import {MutableCardTree} from './cardTree'

const fetchMock = jest.fn(async () => {
    const response = new Response()
    return response
})

global.fetch = fetchMock

beforeEach(() => {
    fetchMock.mockReset()
})

test('CardTree', async () => {
})
