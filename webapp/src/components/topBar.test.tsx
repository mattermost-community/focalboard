// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {render} from '@testing-library/react'
import React from 'react'
import {mocked} from 'jest-mock'

import {wrapDNDIntl} from '../testUtils'
import {Constants} from '../constants'
import {Utils} from '../utils'

import TopBar from './topBar'

Object.defineProperty(Constants, 'versionString', {value: '1.0.0'})
jest.mock('../utils')
const mockedUtils = mocked(Utils, true)

describe('src/components/topBar', () => {
    beforeEach(jest.resetAllMocks)
    test('should match snapshot for focalboardPlugin', () => {
        mockedUtils.isFocalboardPlugin.mockReturnValue(true)
        const {container} = render(wrapDNDIntl(
            <TopBar/>,
        ))
        expect(container).toMatchSnapshot()
    })
    test('should match snapshot for none focalboardPlugin', () => {
        mockedUtils.isFocalboardPlugin.mockReturnValue(false)
        const {container} = render(wrapDNDIntl(
            <TopBar/>,
        ))
        expect(container).toMatchSnapshot()
    })
})
