// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IntlProvider} from 'react-intl'
import React from 'react'
import configureStore, {MockStoreEnhanced} from 'redux-mock-store'
import {Middleware} from 'redux'

export const wrapIntl = (children?: React.ReactNode): JSX.Element => <IntlProvider locale='en'>{children}</IntlProvider>

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
export function mockMatchMedia(result: any): void {
    // We check if system preference is dark or light theme.
    // This is required to provide it's definition since
    // window.matchMedia doesn't exist in Jest.
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => {
            return result

            // return ({
            //     matches: true,
            // })
        }),
    })
}

export function mockStateStore(middleware:Middleware[], state:unknown): MockStoreEnhanced<unknown, unknown> {
    const mockStore = configureStore(middleware)
    return mockStore(state)
}
