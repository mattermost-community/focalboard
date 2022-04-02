// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'

import {render} from '@testing-library/react'
import configureStore from 'redux-mock-store'

import {IUser} from '../../../user'
import {createCard} from '../../../blocks/card'

import CreatedBy from './createdBy'

describe('components/properties/createdBy', () => {
    test('should match snapshot', () => {
        const card = createCard()
        card.createdBy = 'user-id-1'

        const mockStore = configureStore([])
        const store = mockStore({
            users: {
                boardUsers: {
                    'user-id-1': {username: 'username_1'} as IUser,
                },
            },
        })

        const component = (
            <ReduxProvider store={store}>
                <CreatedBy userID='user-id-1'/>
            </ReduxProvider>
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
