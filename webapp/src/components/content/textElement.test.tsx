// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {render, act} from '@testing-library/react'
import {Provider as ReduxProvider} from 'react-redux'

import '@testing-library/jest-dom'

import {mocked} from 'ts-jest/utils'

import {TextBlock} from '../../blocks/textBlock'

import {mockDOM, wrapDNDIntl, mockStateStore} from '../../testUtils'

import {Utils} from '../../utils'

import TextElement from './textElement'

jest.mock('../../utils')
jest.mock('../../mutator')
jest.mock('draft-js/lib/generateRandomKey', () => () => '123')
const mockedUtils = mocked(Utils, true)
mockedUtils.createGuid.mockReturnValue('test-id')
const defaultBlock: TextBlock = {
    id: 'test-id',
    boardId: 'test-id',
    parentId: 'test-id',
    modifiedBy: 'test-user-id',
    schema: 0,
    type: 'text',
    title: '',
    fields: {},
    createdBy: 'test-user-id',
    createAt: 0,
    updateAt: 0,
    deleteAt: 0,
}
describe('components/content/TextElement', () => {
    beforeAll(() => {
        mockDOM()
    })

    const state = {
        users: {
            boardUsers: {
                1: {username: 'abc'},
                2: {username: 'd'},
                3: {username: 'e'},
                4: {username: 'f'},
                5: {username: 'g'},
            },
        },
    }
    const store = mockStateStore([], state)

    test('return a textElement', async () => {
        const component = wrapDNDIntl(
            <ReduxProvider store={store}>
                <TextElement
                    block={defaultBlock}
                    readonly={false}
                />
            </ReduxProvider>,
        )

        let container: Element | undefined
        await act(async () => {
            const result = render(component)
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })
})
