// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {fireEvent, render} from '@testing-library/react'
import '@testing-library/jest-dom'
import {IntlProvider} from 'react-intl'

import 'isomorphic-fetch'

import {act} from 'react-dom/test-utils'

import {DndProvider} from 'react-dnd'
import {HTML5Backend} from 'react-dnd-html5-backend'

import userEvent from '@testing-library/user-event'

import {TestBlockFactory} from '../../test/testBlockFactory'

import TableRows from './tableRows'

const wrapProviders = (children: any) => {
    return (
        <DndProvider backend={HTML5Backend}>
            <IntlProvider locale='en'>{children}</IntlProvider>
        </DndProvider>
    )
}

describe('components/table/TableRows', () => {
    const board = TestBlockFactory.createBoard()
    const view = TestBlockFactory.createBoardView(board)

    const view2 = TestBlockFactory.createBoardView(board)
    view2.fields.sortOptions = []

    const card = TestBlockFactory.createCard(board)
    const cardTemplate = TestBlockFactory.createCard(board)
    cardTemplate.fields.isTemplate = true

    test('should match snapshot, fire events', async () => {
        const callback = jest.fn()
        const addCard = jest.fn()

        const component = wrapProviders(
            <TableRows
                board={board}
                activeView={view}
                columnRefs={new Map()}
                cards={[card]}
                selectedCardIds={[]}
                readonly={false}
                cardIdToFocusOnRender=''
                showCard={callback}
                addCard={addCard}
                onCardClicked={jest.fn()}
                onDrop={jest.fn()}
            />,
        )

        const {container, getByTitle, getByText} = render(<DndProvider backend={HTML5Backend}>{component}</DndProvider>)

        const open = getByText(/Open/i)
        fireEvent.click(open)
        expect(callback).toBeCalled()

        const input = getByTitle(/title/)
        act(() => {
            userEvent.click(input)
            userEvent.keyboard('{enter}')
        })

        expect(addCard).toBeCalled()
        expect(container).toMatchSnapshot()
    })
})
