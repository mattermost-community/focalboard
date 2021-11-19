// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {act, fireEvent, render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import {mocked} from 'ts-jest/utils'

import {mockDOM, wrapDNDIntl} from '../testUtils'

import {Utils} from '../utils'

import {MarkdownEditor} from './markdownEditor'

jest.mock('../utils')
const mockedUtils = mocked(Utils, true)
jest.useFakeTimers()

describe('components/markdownEditor', () => {
    beforeAll(mockDOM)
    beforeEach(jest.clearAllMocks)
    test('should match snapshot', async () => {
        let container
        await act(async () => {
            const result = render(wrapDNDIntl(
                <MarkdownEditor
                    id={'test-id'}
                    text={''}
                    placeholderText={'placeholder'}
                    className={'classname-test'}
                    readonly={false}

                    onChange={jest.fn()}
                    onFocus={jest.fn()}

                    onBlur={jest.fn()}
                    onAccept={jest.fn()}
                />,
            ))
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })
    test('return markdownEditor, write hello and verify blur', async () => {
        const onMockedBlur = jest.fn()
        let container
        await act(async () => {
            const result = render(wrapDNDIntl(
                <MarkdownEditor
                    id={'test-id'}
                    text={''}
                    placeholderText={'placeholder'}
                    className={'classname-test'}
                    readonly={false}

                    onChange={jest.fn()}
                    onFocus={jest.fn()}

                    onBlur={onMockedBlur}
                    onAccept={jest.fn()}
                />,
            ))
            container = result.container
            const elementMarkDown = screen.getByRole('textbox', {hidden: true})
            userEvent.click(elementMarkDown)
        })
        const elementsTextArea = screen.getAllByRole('textbox', {hidden: true})
        expect(elementsTextArea).not.toBeNull()
        expect(elementsTextArea.length).toBeGreaterThanOrEqual(2)
        userEvent.type(elementsTextArea[1], 'hello')
        fireEvent.blur(elementsTextArea[1])
        expect(onMockedBlur).toBeCalledTimes(1)
        expect(onMockedBlur).toBeCalledWith('hello')
        expect(container).toMatchSnapshot()
    })

    test('return markdownEditor, write hi and verify change', async () => {
        const onMockedChange = jest.fn()
        let container
        await act(async () => {
            const result = render(wrapDNDIntl(
                <MarkdownEditor
                    id={'test-id'}
                    text={''}
                    placeholderText={'placeholder'}
                    className={'classname-test'}
                    readonly={false}

                    onChange={onMockedChange}
                    onFocus={jest.fn()}

                    onBlur={jest.fn()}
                    onAccept={jest.fn()}
                />,
            ))
            container = result.container
            const elementMarkDown = screen.getByRole('textbox', {hidden: true})
            userEvent.click(elementMarkDown)
        })
        const elementsTextArea = screen.getAllByRole('textbox', {hidden: true})
        expect(elementsTextArea).not.toBeNull()
        expect(elementsTextArea.length).toBeGreaterThanOrEqual(2)
        const elementText = elementsTextArea[1]
        userEvent.type(elementText, 'h')
        expect(onMockedChange).toBeCalledTimes(1)
        expect(onMockedChange).toBeCalledWith('h')
        userEvent.type(elementText, 'i')
        expect(onMockedChange).toBeCalledTimes(2)
        expect(onMockedChange).toBeCalledWith('hi')
        expect(container).toMatchSnapshot()
    })
    test('return markdownEditor and verify accept', async () => {
        const onMockedAccept = jest.fn()
        await act(async () => {
            render(wrapDNDIntl(
                <MarkdownEditor
                    id={'test-id'}
                    text={''}
                    placeholderText={'placeholder'}
                    className={'classname-test'}
                    readonly={false}

                    onChange={jest.fn()}
                    onFocus={jest.fn()}

                    onBlur={jest.fn()}
                    onAccept={onMockedAccept}
                />,
            ))
            const elementMarkDown = screen.getByRole('textbox', {hidden: true})
            userEvent.click(elementMarkDown)
        })
        const elementsTextArea = screen.getAllByRole('textbox', {hidden: true})
        expect(elementsTextArea).not.toBeNull()
        expect(elementsTextArea.length).toBeGreaterThanOrEqual(2)
        fireEvent.click(elementsTextArea[1])
        fireEvent.keyDown(elementsTextArea[1], {metaKey: true, keyCode: 13})
        act(() => {
            jest.runOnlyPendingTimers()
        })
        expect(mockedUtils.log).toBeCalledTimes(1)
        expect(onMockedAccept).toBeCalledTimes(1)
    })
    test('return markdownEditor and verify blur on escape', async () => {
        const onMockedBlur = jest.fn()
        await act(async () => {
            render(wrapDNDIntl(
                <MarkdownEditor
                    id={'test-id'}
                    text={''}
                    placeholderText={'placeholder'}
                    className={'classname-test'}
                    readonly={false}

                    onChange={jest.fn()}
                    onFocus={jest.fn()}

                    onBlur={onMockedBlur}
                    onAccept={jest.fn()}
                />,
            ))
            const elementMarkDown = screen.getByRole('textbox', {hidden: true})
            userEvent.click(elementMarkDown)
        })
        const elementsTextArea = screen.getAllByRole('textbox', {hidden: true})
        expect(elementsTextArea).not.toBeNull()
        expect(elementsTextArea.length).toBeGreaterThanOrEqual(2)
        fireEvent.click(elementsTextArea[1])
        fireEvent.keyDown(elementsTextArea[1], {keyCode: 27})
        expect(onMockedBlur).toBeCalledTimes(1)
    })
})
