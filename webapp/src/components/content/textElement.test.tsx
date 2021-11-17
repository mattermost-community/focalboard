// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {render, act} from '@testing-library/react'

import '@testing-library/jest-dom'

import {mocked} from 'ts-jest/utils'

import {TextBlock} from '../../blocks/textBlock'

import {mockDOM, wrapDNDIntl} from '../../testUtils'

import {Utils} from '../../utils'

import mutator from '../../mutator'

import TextElement from './textElement'

jest.mock('../../utils')
jest.mock('../../mutator')
const mockedUtils = mocked(Utils, true)
const mockedMutator = mocked(mutator, true)
mockedUtils.createGuid.mockReturnValue('test-id')
const defaultBlock: TextBlock = {
    id: 'test-id',
    workspaceId: 'test-id',
    parentId: 'test-id',
    rootId: 'test-id',
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

    test('return a textElement', async () => {
        const component = wrapDNDIntl(
            <TextElement
                block={defaultBlock}
                readonly={false}
            />,
        )

        let container: Element | undefined
        await act(async () => {
            const result = render(component)
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })
})
