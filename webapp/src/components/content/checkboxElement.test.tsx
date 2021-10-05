// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {fireEvent, render} from '@testing-library/react'
import '@testing-library/jest-dom'

import {wrapIntl} from '../../testUtils'

import {ContentBlock} from '../../blocks/contentBlock'

import CheckboxElement from './checkboxElement'

const fetchMock = require('fetch-mock-jest')

describe('components/content/CheckboxElement', () => {
    const defaultBlock: ContentBlock = {
        id: 'test-id',
        workspaceId: '',
        parentId: '',
        rootId: '',
        modifiedBy: 'test-user-id',
        schema: 0,
        type: 'checkbox',
        title: 'test-title',
        fields: {},
        createdBy: 'test-user-id',
        createAt: 0,
        updateAt: 0,
        deleteAt: 0,
    }

    beforeAll(() => {
        fetchMock.post('*', {})
    })

    afterAll(() => {
        fetchMock.mockClear()
    })

    test('should match snapshot', () => {
        const component = wrapIntl(
            <CheckboxElement
                block={defaultBlock}
                readonly={false}
            />,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot on read only', () => {
        const component = wrapIntl(
            <CheckboxElement
                block={defaultBlock}
                readonly={true}
            />,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot on change title', () => {
        const component = wrapIntl(
            <CheckboxElement
                block={defaultBlock}
                readonly={false}
            />,
        )
        const {container, getByTitle} = render(component)
        const input = getByTitle(/test-title/i)
        fireEvent.blur(input, {target: {textContent: 'changed name'}})
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot on toggle', () => {
        const component = wrapIntl(
            <CheckboxElement
                block={defaultBlock}
                readonly={false}
            />,
        )
        const {container, getByRole} = render(component)
        const input = getByRole('checkbox')
        fireEvent.change(input, {target: {value: 'on'}})
        expect(container).toMatchSnapshot()
    })
})
