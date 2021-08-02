// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import 'isomorphic-fetch'
import {act, render} from '@testing-library/react'

import {FetchMock} from '../../test/fetchMock'
import {TestBlockFactory} from '../../test/testBlockFactory'
import {MutableBoardTree} from '../../viewModel/boardTree'
import {wrapIntl} from '../../testUtils'

import {MutableCardTree} from '../../viewModel/cardTree'

import {IUser} from '../../user'

import CardDetail from './cardDetail'

global.fetch = FetchMock.fn

beforeEach(() => {
    FetchMock.fn.mockReset()
})

describe('components/cardDetail/CardDetail', () => {
    const board = TestBlockFactory.createBoard()

    const view = TestBlockFactory.createBoardView(board)
    view.sortOptions = []
    view.groupById = undefined
    view.hiddenOptionIds = []

    const card = TestBlockFactory.createCard(board)

    const createdAt = Date.parse('01 Jan 2021 00:00:00 GMT')
    const comment1 = TestBlockFactory.createCard(board)
    comment1.type = 'comment'
    comment1.title = 'Comment 1'
    comment1.parentId = card.id
    comment1.createAt = createdAt

    const comment2 = TestBlockFactory.createCard(board)
    comment2.type = 'comment'
    comment2.title = 'Comment 2'
    comment2.parentId = card.id
    comment2.createAt = createdAt

    const cardTree = new MutableCardTree(card)
    cardTree.comments = [comment1, comment2]

    test('should show comments', async () => {
        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, card, comment1, comment2])))
        FetchMock.fn.mockReturnValue(FetchMock.jsonResponse(JSON.stringify({username: 'username_1'} as IUser)))
        const boardTree = await MutableBoardTree.sync(board.id, view.id, {})
        expect(boardTree).not.toBeUndefined()

        const component = wrapIntl(
            <CardDetail
                boardTree={boardTree!}
                cardTree={cardTree}
                readonly={false}
            />,
        )

        let container

        await act(async () => {
            const result = render(component)
            container = result.container
        })

        expect(container).toMatchSnapshot()
    })

    test('should show comments in readonly view', async () => {
        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, card, comment1, comment2])))
        FetchMock.fn.mockReturnValue(FetchMock.jsonResponse(JSON.stringify({username: 'username_1'} as IUser)))
        const boardTree = await MutableBoardTree.sync(board.id, view.id, {})
        expect(boardTree).not.toBeUndefined()

        const component = wrapIntl(
            <CardDetail
                boardTree={boardTree!}
                cardTree={cardTree}
                readonly={true}
            />,
        )

        let container

        await act(async () => {
            const result = render(component)
            container = result.container
        })

        expect(container).toMatchSnapshot()
    })
})
