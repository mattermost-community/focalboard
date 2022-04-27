// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'

import {render} from '@testing-library/react'
import configureStore from 'redux-mock-store'

import {IUser} from '../../../user'
import {createCard} from '../../../blocks/card'

import {wrapIntl} from '../../../testUtils'

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

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <CreatedBy userID='user-id-1'/>
            </ReduxProvider>
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot as guest', () => {
        const card = createCard()
        card.createdBy = 'user-id-1'

        const mockStore = configureStore([])
        const store = mockStore({
            users: {
                boardUsers: {
                    'user-id-1': {username: 'username_1', is_guest: true} as IUser,
                },
            },
        })

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <CreatedBy userID='user-id-1'/>
            </ReduxProvider>
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
