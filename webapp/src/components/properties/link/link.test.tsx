// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {render} from '@testing-library/react'

import '@testing-library/jest-dom'
import {IntlProvider} from 'react-intl'

import Link from './link'

const wrapIntl = (children: any) => <IntlProvider locale='en'>{children}</IntlProvider>

describe('components/properties/link', () => {
    test('returns link properties correctly', () => {
        const component = wrapIntl(
            <Link
                value={'https://github.com/mattermost/focalboard'}
                onChange={jest.fn()}
                onSave={jest.fn()}
                onCancel={jest.fn()}
                validator={jest.fn(() => {
                    return true
                })}
            />,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
