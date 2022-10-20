// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {render} from '@testing-library/react'

import {act} from 'react-dom/test-utils'

import {mocked} from 'jest-mock'

import {FileBlock} from '../../blocks/fileBlock'

import {wrapIntl} from '../../testUtils'

import octoClient from '../../octoClient'

import FileElement from './fileElement'

jest.mock('../../octoClient')
const mockedOcto = mocked(octoClient, true)
mockedOcto.getFileAsDataUrl.mockResolvedValue({url: 'test.txt'})
mockedOcto.getFileInfo.mockResolvedValue({
    name: 'test.txt',
    size: 2300,
    extension: '.txt',
})

describe('component/content/FileBlock', () => {
    const defaultBlock: FileBlock = {
        id: 'test-id',
        boardId: '1',
        parentId: '',
        modifiedBy: 'test-user-id',
        schema: 0,
        type: 'attachment',
        title: 'test-title',
        fields: {
            attachmentId: 'test.txt',
        },
        createdBy: 'test-user-id',
        createAt: 0,
        updateAt: 0,
        deleteAt: 0,
        limited: false,
    }

    test('should match snapshot', async () => {
        const component = wrapIntl(
            <FileElement
                block={defaultBlock}
            />,
        )
        let fileContainer: Element | undefined
        await act(async () => {
            const {container} = render(component)
            fileContainer = container
        })
        expect(fileContainer).toMatchSnapshot()
    })

    test('archived file', async () => {
        mockedOcto.getFileAsDataUrl.mockResolvedValue({
            archived: true,
            name: 'FileName',
            extension: '.txt',
            size: 165002,
        })

        const component = wrapIntl(
            <FileElement
                block={defaultBlock}
            />,
        )
        let fileContainer: Element | undefined
        await act(async () => {
            const {container} = render(component)
            fileContainer = container
        })
        expect(fileContainer).toMatchSnapshot()
    })
})
