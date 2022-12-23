// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import '@testing-library/jest-dom'
import {act, render} from '@testing-library/react'

import React from 'react'

import {wrapIntl} from '../../testUtils'

import FormattingMenu from './formattingMenu'

describe('components/formattingMenu', () => {
    test('should match snapshot', async () => {
        let container
        await act(async () => {
            const result = render(wrapIntl(
                <FormattingMenu/>,
            ))
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })
})
