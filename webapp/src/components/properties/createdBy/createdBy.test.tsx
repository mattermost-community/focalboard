// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {render} from '@testing-library/react'

import {IUser, WorkspaceUsersContext} from '../../../user'
import {MutableCard} from '../../../blocks/card'

import CreatedBy from './createdBy'

describe('components/properties/createdBy', () => {
    test('should match snapshot', () => {
        const workspaceUsers = {
            users: new Array<IUser>(),
            usersById: new Map<string, IUser>(),
        }
        workspaceUsers.usersById.set('user-id-1', {username: 'username_1'} as IUser)

        const card = new MutableCard()
        card.createdBy = 'user-id-1'

        const component = (
            <WorkspaceUsersContext.Provider value={workspaceUsers}>
                <CreatedBy userID='user-id-1'/>
            </WorkspaceUsersContext.Provider>
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
