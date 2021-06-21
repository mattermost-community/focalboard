// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {render} from '@testing-library/react'
import '@testing-library/jest-dom'
import {IntlProvider} from 'react-intl'

import 'isomorphic-fetch'
import {DndProvider} from 'react-dnd'
import {HTML5Backend} from 'react-dnd-html5-backend'

import {TestBlockFactory} from '../../test/testBlockFactory'
import {FetchMock} from '../../test/fetchMock'
import {MutableBoardTree} from '../../viewModel/boardTree'

import TableHeader from './tableHeader'

global.fetch = FetchMock.fn

beforeEach(() => {
    FetchMock.fn.mockReset()
})

const wrapProviders = (children: any) => {
    return (
        <DndProvider backend={HTML5Backend}>
            <IntlProvider locale='en'>{children}</IntlProvider>
        </DndProvider>
    )
}

describe('components/table/TableHeaderMenu', () => {
    const board = TestBlockFactory.createBoard()
    const view = TestBlockFactory.createBoardView(board)

    const view2 = TestBlockFactory.createBoardView(board)
    view2.sortOptions = []

    const card = TestBlockFactory.createCard(board)
    const cardTemplate = TestBlockFactory.createCard(board)
    cardTemplate.isTemplate = true

    test('should match snapshot, title column', async () => {
        // Sync
        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, view2, card, cardTemplate])))

        const boardTree = await MutableBoardTree.sync(board.id, view.id)
        expect(boardTree).toBeDefined()
        expect(FetchMock.fn).toBeCalledTimes(1)
        const onAutoSizeColumn = jest.fn()
        const component = wrapProviders(
            <TableHeader
                readonly={false}
                sorted={'none'}
                name={'my Name'}
                boardTree={boardTree!}
                template={board.cardProperties[0]}
                offset={0}
                onDrop={jest.fn()}
                onAutoSizeColumn={onAutoSizeColumn}
            />,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
