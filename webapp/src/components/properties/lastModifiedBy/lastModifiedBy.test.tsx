// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'

import {render} from '@testing-library/react'
import configureStore from 'redux-mock-store'

import {MutableCard} from '../../../blocks/card'
import {IUser} from '../../../user'

import {MutableBoard} from '../../../blocks/board'

import {MutableBlock} from '../../../blocks/block'

import LastModifiedBy from './lastModifiedBy'

describe('components/properties/lastModifiedBy', () => {
    test('should match snapshot', () => {
        const card = new MutableCard()
        card.id = 'card-id-1'
        card.modifiedBy = 'user-id-1'

        const board = new MutableBoard([])
        const block = new MutableBlock()
        block.modifiedBy = 'user-id-1'
        block.parentId = 'card-id-1'
        block.type = 'comment'

        const mockStore = configureStore([])
        const store = mockStore({
            currentWorkspaceUsers: {
                byId: {
                    'user-id-1': {username: 'username_1'} as IUser,
                },
            },
        })

        const component = (
            <ReduxProvider store={store}>
                <LastModifiedBy
                    card={card}
                    board={board}
                    contents={[]}
                    comments={[block]}
                />
            </ReduxProvider>
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
