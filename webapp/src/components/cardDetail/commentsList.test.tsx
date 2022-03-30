// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import 'isomorphic-fetch'

import {render} from '@testing-library/react'

import {act} from 'react-dom/test-utils'

import {Provider as ReduxProvider} from 'react-redux'
import configureStore from 'redux-mock-store'

import {CommentBlock} from '../../blocks/commentBlock'

import {mockDOM, wrapIntl} from '../../testUtils'

import {FetchMock} from '../../test/fetchMock'

import CommentsList from './commentsList'

global.fetch = FetchMock.fn

beforeEach(() => {
    FetchMock.fn.mockReset()
})

beforeAll(() => {
    mockDOM()
})

describe('components/cardDetail/CommentsList', () => {
    const createdAt = Date.parse('01 Jan 2021 00:00:00 GMT')
    const comment1: CommentBlock = {
        id: 'comment_id_1',
        title: 'Comment 1',
        createAt: createdAt,
        modifiedBy: 'user_id_1',
    } as CommentBlock

    const comment2: CommentBlock = {
        id: 'comment_id_2',
        title: 'Comment 2',
        createAt: createdAt,
        modifiedBy: 'user_id_2',
    } as CommentBlock

    test('comments show up', async () => {
        const mockStore = configureStore([])
        const store = mockStore({
            users: {
                boardUsers: [
                    {username: 'username_1'},
                ],
            },
            boards: {
                boards: {
                    board_id_1: {title: 'Board'},
                },
                current: 'board_id_1',
            },
            cards: {
                cards: {
                    card_id_1: {title: 'Card'},
                },
                current: 'card_id_1',
            },
            clientConfig: {
                value: {
                    featureFlags: {},
                },
            },
        })

        const component = (
            <ReduxProvider store={store}>
                {wrapIntl(
                    <CommentsList
                        comments={[comment1, comment2]}
                        cardId={'card_id'}
                        boardId={'board_id'}
                        readonly={false}
                    />,
                )}
            </ReduxProvider>)

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

    test('comments show up in readonly mode', async () => {
        const mockStore = configureStore([])
        const store = mockStore({
            users: {
                boardUsers: [
                    {username: 'username_1'},
                ],
            },
        })

        const component = (
            <ReduxProvider store={store}>
                {wrapIntl(
                    <CommentsList
                        comments={[comment1, comment2]}
                        cardId={'card_id'}
                        boardId={'board_id'}
                        readonly={true}
                    />,
                )}
            </ReduxProvider>)

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
        expect(newCommentSection.length).toBe(0)
    })
})
