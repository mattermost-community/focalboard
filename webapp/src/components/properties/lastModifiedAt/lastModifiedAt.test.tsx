// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {render} from '@testing-library/react'

import {CardTree, CardTreeContext, MutableCardTree} from '../../../viewModel/cardTree'

import {MutableCard} from '../../../blocks/card'

import {MutableBoardTree} from '../../../viewModel/boardTree'
import {MutableBoard} from '../../../blocks/board'
import {MutableBlock} from '../../../blocks/block'

import LastModifiedAt from './lastModifiedAt'

describe('componnets/properties/lastModifiedAt', () => {
    test('should match snapshot', () => {
        const cardTree = new MutableCardTree(
            new MutableCard({
                updateAt: Date.parse('15 Jun 2021 16:22:00'),
            }),
        )

        const card = new MutableCard()
        card.id = 'card-id-1'
        card.modifiedBy = 'user-id-1'
        card.updateAt = Date.parse('10 Jun 2021 16:22:00')

        const boardTree = new MutableBoardTree(new MutableBoard([]), {})
        const block = new MutableBlock()
        block.modifiedBy = 'user-id-1'
        block.parentId = 'card-id-1'
        block.type = 'comment'
        block.updateAt = Date.parse('15 Jun 2021 16:22:00')
        boardTree.rawBlocks.push(block)

        const cardTrees:{ [key: string]: CardTree | undefined } = {}
        cardTrees[card.id] = new MutableCardTree(card)

        const component = (
            <CardTreeContext.Provider value={cardTree}>
                <LastModifiedAt
                    card={card}
                    cardTree={cardTree}
                />
            </CardTreeContext.Provider>
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
