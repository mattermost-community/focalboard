// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {act, render} from '@testing-library/react'

import configureStore from 'redux-mock-store'

import {Provider as ReduxProvider} from 'react-redux'

import {mocked} from 'jest-mock'

import {createCard} from '../../../../../webapp/src/blocks/card'
import {createBoard} from '../../../../../webapp/src/blocks/board'
import octoClient from '../../../../../webapp/src/octoClient'
import {wrapIntl} from '../../../../../webapp/src/testUtils'

import BoardsUnfurl from './boardsUnfurl'

jest.mock('../../../../../webapp/src/octoClient')
const mockedOctoClient = mocked(octoClient, true)

describe('components/boardsUnfurl/BoardsUnfurl', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders normally', async () => {
        const mockStore = configureStore([])
        const store = mockStore({
            entities: {
                users: {
                    currentUserId: 'id_1',
                    profiles: {
                        id_1: {
                            locale: 'en',
                        },
                    },
                },
            },
        })

        const cards = [{...createCard(), title: 'test card'}]
        const board = {...createBoard(), title: 'test board'}

        mockedOctoClient.getBlocksWithBlockID.mockResolvedValueOnce(cards)
        mockedOctoClient.getBoard.mockResolvedValueOnce(board)

        const component = (
            <ReduxProvider store={store}>
                {wrapIntl(
                    <BoardsUnfurl
                        embed={{data: '{"workspaceID": "foo", "cardID": "bar", "boardID": "baz", "readToken": "abc", "originalPath": "/test"}'}}
                    />,
                )}
            </ReduxProvider>
        )

        let container: Element | DocumentFragment | null = null

        await act(async () => {
            const result = render(component)
            container = result.container
        })

        expect(container).toMatchSnapshot()
    })

    it('renders when limited', async () => {
        const mockStore = configureStore([])
        const store = mockStore({
            entities: {
                users: {
                    currentUserId: 'id_1',
                    profiles: {
                        id_1: {
                            locale: 'en',
                        },
                    },
                },
            },
        })

        const cards = [{...createCard(), title: 'test card', limited: true}]
        const board = {...createBoard(), title: 'test board'}

        mockedOctoClient.getBlocksWithBlockID.mockResolvedValueOnce(cards)
        mockedOctoClient.getBoard.mockResolvedValueOnce(board)

        const component = (
            <ReduxProvider store={store}>
                {wrapIntl(
                    <BoardsUnfurl
                        embed={{data: '{"workspaceID": "foo", "cardID": "bar", "boardID": "baz", "readToken": "abc", "originalPath": "/test"}'}}
                    />,
                )}
            </ReduxProvider>
        )

        let container: Element | DocumentFragment | null = null

        await act(async () => {
            const result = render(component)
            container = result.container
        })

        expect(container).toMatchSnapshot()
    })
})

