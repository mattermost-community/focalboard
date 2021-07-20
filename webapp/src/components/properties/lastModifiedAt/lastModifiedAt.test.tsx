// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {render} from '@testing-library/react'

import {MutableCard} from '../../../blocks/card'

import {MutableBlock} from '../../../blocks/block'

import LastModifiedAt from './lastModifiedAt'

describe('componnets/properties/lastModifiedAt', () => {
    test('should match snapshot', () => {
        const card = new MutableCard()
        card.id = 'card-id-1'
        card.modifiedBy = 'user-id-1'
        card.updateAt = Date.parse('10 Jun 2021 16:22:00')

        const block = new MutableBlock()
        block.modifiedBy = 'user-id-1'
        block.parentId = 'card-id-1'
        block.type = 'comment'
        block.updateAt = Date.parse('15 Jun 2021 16:22:00')

        const component = (
            <LastModifiedAt
                card={card}
                contents={[]}
                comments={[block]}
            />
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
