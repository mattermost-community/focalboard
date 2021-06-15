// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {render} from '@testing-library/react'

import {MutableCardTree, CardTreeContext} from '../../../viewModel/cardTree'
import {MutableCard} from '../../../blocks/card'
import {IUser, WorkspaceUsersContext} from '../../../user'

import LastModifiedBy from './lastModifiedBy'

describe('components/properties/lastModifiedBy', () => {
    test('should match snapshot', () => {
        const cardTree = new MutableCardTree(
            new MutableCard({
                updateAt: Date.parse('15 Jun 2021 16:22:00 +05:30'),
                modifiedBy: 'user-id-1',
            }),

        )

        const workspaceUsers = {
            users: new Array<IUser>(),
            usersById: new Map<string, IUser>(),
        }
        workspaceUsers.usersById.set('user-id-1', {username: 'username_1'} as IUser)

        const component = (
            <WorkspaceUsersContext.Provider value={workspaceUsers}>
                <CardTreeContext.Provider value={cardTree}>
                    <LastModifiedBy/>
                </CardTreeContext.Provider>
            </WorkspaceUsersContext.Provider>
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
