// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Utils} from './utils'

test('assureProtocol', async () => {
    expect(Utils.ensureProtocol('https://focalboard.com')).toBe('https://focalboard.com')

    // long protocol
    expect(Utils.ensureProtocol('somecustomprotocol://focalboard.com')).toBe('somecustomprotocol://focalboard.com')

    // short protocol
    expect(Utils.ensureProtocol('x://focalboard.com')).toBe('x://focalboard.com')

    // no protocol
    expect(Utils.ensureProtocol('focalboard.com')).toBe('https://focalboard.com')
})
