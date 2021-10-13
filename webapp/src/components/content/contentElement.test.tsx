// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {render} from '@testing-library/react'

import {wrapIntl} from '../../testUtils'

import {ContentBlock} from '../../blocks/contentBlock'

import ContentElement from './contentElement'

describe('components/content/contentElement', () => {
    test('return an element', () => {
        const contentBlock: ContentBlock = {
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
        const checkBoxElement = ContentElement({block: contentBlock, readonly: false})
        const {container} = render(wrapIntl(checkBoxElement))
        expect(container).toMatchSnapshot()
    })

    test('return null', () => {
        const contentBlock: ContentBlock = {
            id: 'test-id',
            workspaceId: '',
            parentId: '',
            rootId: '',
            modifiedBy: 'test-user-id',
            schema: 0,
            type: 'unknown',
            title: 'test-title',
            fields: {},
            createdBy: 'test-user-id',
            createAt: 0,
            updateAt: 0,
            deleteAt: 0,
        }
        const contentElement = ContentElement({block: contentBlock, readonly: false})
        expect(contentElement).toBeNull()
    })
})
