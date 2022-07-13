// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'

import {render} from '@testing-library/react'
import configureStore from 'redux-mock-store'

import {IUser} from '../../user'
import {createCard, Card} from '../../blocks/card'
import {Board, IPropertyTemplate} from '../../blocks/board'

import CreatedByProperty from './property'
import CreatedBy from './createdBy'

describe('properties/createdBy', () => {
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
            clientConfig: {
                value: {
                    teammateNameDisplay: 'username',
                },
            },
        })

        const component = (
            <ReduxProvider store={store}>
                <CreatedBy
                    property={new CreatedByProperty}
                    board={{} as Board}
                    card={{createdBy: 'user-id-1'} as Card}
                    readOnly={false}
                    propertyTemplate={{} as IPropertyTemplate}
                    propertyValue={''}
                    showEmptyPlaceholder={false}
                />
            </ReduxProvider>
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
