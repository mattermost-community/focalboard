// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {render} from '@testing-library/react'
import React from 'react'

import {CalculationOptions} from './options'

describe('components/calculations/Options', () => {
    test('should match snapshot', () => {
        const component = (
            <CalculationOptions
                value={'none'}
                onChange={() => {}}
            />
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot menu open', () => {
        const component = (
            <CalculationOptions
                value={'none'}
                menuOpen={true}
                onChange={() => {}}
            />
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
