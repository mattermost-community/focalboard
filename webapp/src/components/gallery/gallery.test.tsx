// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {render, screen, fireEvent} from '@testing-library/react'

import {Provider as ReduxProvider} from 'react-redux'

import userEvent from '@testing-library/user-event'

import {mocked} from 'ts-jest/utils'

import {wrapDNDIntl, mockStateStore} from '../../testUtils'

import {TestBlockFactory} from '../../test/testBlockFactory'

import mutator from '../../mutator'

import Gallery from './gallery'

jest.mock('../../mutator')
const mockedMutator = mocked(mutator, true)

describe('src/components/gallery/Gallery', () => {
    const board = TestBlockFactory.createBoard()
    const activeView = TestBlockFactory.createBoardView(board)
    activeView.fields.sortOptions = []
    const card = TestBlockFactory.createCard(board)
    const card2 = TestBlockFactory.createCard(board)
    const contents = [TestBlockFactory.createDivider(card), TestBlockFactory.createDivider(card), TestBlockFactory.createDivider(card2)]
    const state = {
        contents,
        cards: {
            cards: {
                [card.id]: card,
            },
        },
        comments: {
            comments: {},
        },
    }
    const store = mockStateStore([], state)
    beforeEach(() => {
        jest.clearAllMocks()
    })
    test('should match snapshot', () => {
        const {container} = render(wrapDNDIntl(
            <ReduxProvider store={store}>
                <Gallery
                    board={board}
                    cards={[card, card2]}
                    activeView={activeView}
                    readonly={false}
                    addCard={jest.fn()}
                    selectedCardIds={[card.id]}
                    onCardClicked={jest.fn()}
                />
            </ReduxProvider>,
        ))
        const buttonElement = screen.getAllByRole('button', {name: 'menuwrapper'})[0]
        userEvent.click(buttonElement)
        expect(container).toMatchSnapshot()
    })
    test('return Gallery and click new', () => {
        const mockAddCard = jest.fn()
        const {container} = render(wrapDNDIntl(
            <ReduxProvider store={store}>
                <Gallery
                    board={board}
                    cards={[card, card2]}
                    activeView={activeView}
                    readonly={false}
                    addCard={mockAddCard}
                    selectedCardIds={[card.id]}
                    onCardClicked={jest.fn()}
                />
            </ReduxProvider>,
        ))
        expect(container).toMatchSnapshot()

        const elementNew = container.querySelector('.octo-gallery-new')!
        expect(elementNew).toBeDefined()
        userEvent.click(elementNew)
        expect(mockAddCard).toBeCalledTimes(1)
    })

    test('return Gallery readonly', () => {
        const {container} = render(wrapDNDIntl(
            <ReduxProvider store={store}>
                <Gallery
                    board={board}
                    cards={[card, card2]}
                    activeView={activeView}
                    readonly={true}
                    addCard={jest.fn()}
                    selectedCardIds={[card.id]}
                    onCardClicked={jest.fn()}
                />
            </ReduxProvider>,
        ))
        expect(container).toMatchSnapshot()
    })
    test('return Gallery and drag and drop card', async () => {
        const {container} = render(wrapDNDIntl(
            <ReduxProvider store={store}>
                <Gallery
                    board={board}
                    cards={[card, card2]}
                    activeView={activeView}
                    readonly={false}
                    addCard={jest.fn()}
                    selectedCardIds={[]}
                    onCardClicked={jest.fn()}
                />
            </ReduxProvider>,
        ))
        const allGalleryCard = container.querySelectorAll('.GalleryCard')
        const drag = allGalleryCard[0]
        const drop = allGalleryCard[1]
        fireEvent.dragStart(drag)
        fireEvent.dragEnter(drop)
        fireEvent.dragOver(drop)
        fireEvent.drop(drop)
        expect(mockedMutator.performAsUndoGroup).toBeCalledTimes(1)
    })
})
