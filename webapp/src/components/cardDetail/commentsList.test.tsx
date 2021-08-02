// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import 'isomorphic-fetch'

import {render} from '@testing-library/react'

import {act} from 'react-dom/test-utils'

import {CommentBlock} from '../../blocks/commentBlock'

import {wrapIntl} from '../../testUtils'

import {FetchMock} from '../../test/fetchMock'
import {IUser} from '../../user'

import CommentsList from './commentsList'

global.fetch = FetchMock.fn

beforeEach(() => {
    FetchMock.fn.mockReset()
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
        FetchMock.fn.mockReturnValue(FetchMock.jsonResponse(JSON.stringify({username: 'username_1'} as IUser)))
        const component = wrapIntl(
            <CommentsList
                comments={[comment1, comment2]}
                rootId={'root_id'}
                cardId={'card_id'}
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

    test('comments show up in readonly mode', async () => {
        FetchMock.fn.mockReturnValue(FetchMock.jsonResponse(JSON.stringify({username: 'username_1'} as IUser)))
        const component = wrapIntl(
            <CommentsList
                comments={[comment1, comment2]}
                rootId={'root_id'}
                cardId={'card_id'}
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
