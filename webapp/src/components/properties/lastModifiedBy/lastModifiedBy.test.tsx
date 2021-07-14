// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'

import {render} from '@testing-library/react'
import configureStore from 'redux-mock-store'

import {MutableCardTree, CardTreeContext} from '../../../viewModel/cardTree'
import {MutableCard} from '../../../blocks/card'
import {IUser} from '../../../user'

import {MutableBoardTree} from '../../../viewModel/boardTree'

import {MutableBoard} from '../../../blocks/board'

import {MutableBlock} from '../../../blocks/block'

import LastModifiedBy from './lastModifiedBy'

describe('components/properties/lastModifiedBy', () => {
    test('should match snapshot', () => {
        const cardTree = new MutableCardTree(
            new MutableCard({
                updateAt: Date.parse('15 Jun 2021 16:22:00 +05:30'),
                modifiedBy: 'user-id-1',
            }),

        )

        const card = new MutableCard()
        card.id = 'card-id-1'
        card.modifiedBy = 'user-id-1'

        const boardTree = new MutableBoardTree(new MutableBoard([]), {
            'user-id-1': {username: 'username_1'} as IUser,
        })
        const block = new MutableBlock()
        block.modifiedBy = 'user-id-1'
        block.parentId = 'card-id-1'
        block.type = 'comment'
        boardTree.rawBlocks.push(block)

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
                <CardTreeContext.Provider value={cardTree}>
                    <LastModifiedBy
                        card={card}
                        boardTree={boardTree}
                    />
                </CardTreeContext.Provider>
            </ReduxProvider>
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
