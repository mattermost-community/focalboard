// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'

import {render} from '@testing-library/react'
import configureStore from 'redux-mock-store'

import {createCard} from '../../../blocks/card'
import {wrapIntl} from '../../../testUtils'

import {createCommentBlock} from '../../../blocks/commentBlock'

import LastModifiedAt from './lastModifiedAt'

describe('components/properties/lastModifiedAt', () => {
    test('should match snapshot', () => {
        const card = createCard()
        card.id = 'card-id-1'
        card.modifiedBy = 'user-id-1'
        card.updateAt = Date.parse('10 Jun 2021 16:22:00')

        const comment = createCommentBlock()
        comment.modifiedBy = 'user-id-1'
        comment.parentId = 'card-id-1'
        comment.updateAt = Date.parse('15 Jun 2021 16:22:00')

        const mockStore = configureStore([])
        const store = mockStore({
            comments: {
                comments: {
                    [comment.id]: comment,
                },
                commentsByCard: {
                    [card.id]: [comment],
                },
            },
        })

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <LastModifiedAt card={card}/>
            </ReduxProvider>,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
