// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {render} from '@testing-library/react'
import React from 'react'

import {wrapDNDIntl} from '../testUtils'
import {Constants} from '../constants'

import TopBar from './topBar'

Object.defineProperty(Constants, 'versionString', {value: '1.0.0'})

describe('src/components/topBar', () => {
    beforeEach(jest.resetAllMocks)
    test('should match snapshot for focalboardPlugin', () => {
        const {container} = render(wrapDNDIntl(
            <TopBar/>,
        ))
        expect(container).toMatchSnapshot()
    })
})
