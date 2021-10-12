// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {render, act, screen} from '@testing-library/react'

import '@testing-library/jest-dom'

import userEvent from '@testing-library/user-event'

import {wrapIntl} from '../testUtils'

import {FlashMessages, sendFlashMessage} from './flashMessages'

jest.mock('../mutator')

beforeEach(() => {
    jest.useFakeTimers()
})

afterEach(() => {
    jest.clearAllTimers()
})

describe('components/flashMessages', () => {
    test('renders a flash message with high severity', () => {
        const {container} = render(
            wrapIntl(<FlashMessages milliseconds={200}/>),
        )

        /**
         * Check for high severity
         */

        act(() => {
            sendFlashMessage({content: 'Mock Content', severity: 'high'})
        })

        expect(container).toMatchSnapshot()

        act(() => {
            jest.advanceTimersByTime(200)
        })

        expect(screen.queryByText('Mock Content')).toBeNull()

        /**
         * Check for normal severity
         */

        act(() => {
            sendFlashMessage({content: 'Mock Content', severity: 'normal'})
        })

        expect(screen.getByText('Mock Content')).toHaveClass('normal')

        act(() => {
            jest.advanceTimersByTime(200)
        })

        expect(screen.queryByText('Mock Content')).toBeNull()

        /**
         * Check for low severity
         */

        act(() => {
            sendFlashMessage({content: 'Mock Content', severity: 'low'})
        })

        expect(screen.getByText('Mock Content')).toHaveClass('low')

        act(() => {
            jest.advanceTimersByTime(200)
        })

        expect(screen.queryByText('Mock Content')).toBeNull()

        /**
         * Check with a custom HTML in flash message
         */

        act(() => {
            sendFlashMessage({content: <div data-testid='mock-test-id'>{'Mock Content'}</div>, severity: 'low'})
        })

        expect(screen.getByTestId('mock-test-id')).toBeVisible()

        act(() => {
            jest.advanceTimersByTime(200)
        })

        expect(screen.queryByText('Mock Content')).toBeNull()

        /**
         * Check that onClick on flash works
         */

        act(() => {
            sendFlashMessage({content: 'Mock Content', severity: 'low'})
        })

        userEvent.click(screen.getByText('Mock Content'))

        act(() => {
            jest.advanceTimersByTime(200)
        })

        expect(screen.queryByText('Mock Content')).toBeNull()
    })
})
