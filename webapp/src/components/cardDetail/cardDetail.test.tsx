// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import 'isomorphic-fetch'
import {act, render} from '@testing-library/react'

import configureStore from 'redux-mock-store'
import {Provider as ReduxProvider} from 'react-redux'

import {FetchMock} from '../../test/fetchMock'
import {TestBlockFactory} from '../../test/testBlockFactory'

import {mockDOM, wrapIntl} from '../../testUtils'

import CardDetail from './cardDetail'

global.fetch = FetchMock.fn

beforeEach(() => {
    FetchMock.fn.mockReset()
})

// This is needed to run EasyMDE in tests.
// It needs bounding rectangle box property
// on HTML elements, but Jest's HTML engine jsdom
// doesn't provide it.
// So we mock it.
beforeAll(() => {
    mockDOM()
})

describe('components/cardDetail/CardDetail', () => {
    const board = TestBlockFactory.createBoard()

    const view = TestBlockFactory.createBoardView(board)
    view.fields.sortOptions = []
    view.fields.groupById = undefined
    view.fields.hiddenOptionIds = []

    const card = TestBlockFactory.createCard(board)

    const createdAt = Date.parse('01 Jan 2021 00:00:00 GMT')
    const comment1 = TestBlockFactory.createComment(card)
    comment1.type = 'comment'
    comment1.title = 'Comment 1'
    comment1.parentId = card.id
    comment1.createAt = createdAt

    const comment2 = TestBlockFactory.createComment(card)
    comment2.type = 'comment'
    comment2.title = 'Comment 2'
    comment2.parentId = card.id
    comment2.createAt = createdAt

    test('should show comments', async () => {
        const mockStore = configureStore([])
        const store = mockStore({
            users: {
                workspaceUsers: [
                    {username: 'username_1'},
                ],
            },
        })

        const component = (
            <ReduxProvider store={store}>
                {wrapIntl(
                    <CardDetail
                        board={board}
                        activeView={view}
                        views={[view]}
                        cards={[card]}
                        card={card}
                        comments={[comment1, comment2]}
                        contents={[]}
                        readonly={false}
                    />,
                )}
            </ReduxProvider>
        )

        let container: Element | DocumentFragment | null = null

        await act(async () => {
            const result = render(component)
            container = result.container
        })

        expect(container).toBeDefined()

        // Comments show up
        const comments = container!.querySelectorAll('.comment-text')
        expect(comments.length).toBe(2)

        // Add comment option visible when readonly mode is off
        const newCommentSection = container!.querySelectorAll('.newcomment')
        expect(newCommentSection.length).toBe(1)
    })

    test('should show comments in readonly view', async () => {
        const mockStore = configureStore([])
        const store = mockStore({
            users: {
                workspaceUsers: [
                    {username: 'username_1'},
                ],
            },
        })

        const component = (
            <ReduxProvider store={store}>
                {wrapIntl(
                    <CardDetail
                        board={board}
                        activeView={view}
                        views={[view]}
                        cards={[card]}
                        card={card}
                        comments={[comment1, comment2]}
                        contents={[]}
                        readonly={true}
                    />,
                )}
            </ReduxProvider>
        )

        let container: Element | DocumentFragment | null = null

        await act(async () => {
            const result = render(component)
            container = result.container
        })

        expect(container).toBeDefined()

        // comments show up
        const comments = container!.querySelectorAll('.comment-text')
        expect(comments.length).toBe(2)

        // Add comment option is not shown in readonly mode
        const newCommentSection = container!.querySelectorAll('.newcomment')
        expect(newCommentSection.length).toBe(0)
    })
})
