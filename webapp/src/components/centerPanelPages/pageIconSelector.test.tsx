// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import '@testing-library/jest-dom'
import {act, render} from '@testing-library/react'

import React from 'react'

import {wrapIntl} from '../../testUtils'
import {TestBlockFactory} from '../../test/testBlockFactory'

import PageIconSelector from './pageIconSelector'

describe('components/pageIconSelector', () => {
    test('should match snapshot in root page', async () => {
        const board = TestBlockFactory.createBoard()
        board.icon = 'i'
        const page = TestBlockFactory.createPage(board)
        let container
        await act(async () => {
            const result = render(wrapIntl(
                <PageIconSelector
                    board={board}
                    page={page}
                />,
            ))
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })

    test('should be empty for root page without icon in the board', async () => {
        const board = TestBlockFactory.createBoard()
        board.icon = ''
        const page = TestBlockFactory.createPage(board)
        let container
        await act(async () => {
            const result = render(wrapIntl(
                <PageIconSelector
                    board={board}
                    page={page}
                />,
            ))
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot in non root page with icon', async () => {
        const board = TestBlockFactory.createBoard()
        board.icon = ''
        const page = TestBlockFactory.createPage(board)
        page.parentId = 'whatever'
        page.fields.icon = 'i'
        let container
        await act(async () => {
            const result = render(wrapIntl(
                <PageIconSelector
                    page={page}
                    board={board}
                />,
            ))
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })

    test('should be empty for not root page without icon', async () => {
        const board = TestBlockFactory.createBoard()
        board.icon = ''
        const page = TestBlockFactory.createPage(board)
        page.parentId = 'whatever'
        page.fields.icon = ''
        let container
        await act(async () => {
            const result = render(wrapIntl(
                <PageIconSelector
                    page={page}
                    board={board}
                />,
            ))
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })
})
