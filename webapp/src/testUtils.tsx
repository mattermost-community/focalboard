// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IntlProvider} from 'react-intl'
import React from 'react'

export const wrapIntl = (children: any) => <IntlProvider locale='en'>{children}</IntlProvider>

export function mockDOM(): void {
    window.focus = jest.fn()
    document.createRange = () => {
        const range = new Range()

        range.getBoundingClientRect = jest.fn()

        range.getClientRects = () => {
            return {
                item: () => null,
                length: 0,
                [Symbol.iterator]: jest.fn(),
            }
        }

        return range
    }
}
