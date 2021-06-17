// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {render} from '@testing-library/react'

import {CardTreeContext, MutableCardTree} from '../../../viewModel/cardTree'

import {MutableCard} from '../../../blocks/card'

import LastModifiedAt from './lastModifiedAt'

describe('componnets/properties/lastModifiedAt', () => {
    test('should match snapshot', () => {
        const cardTree = new MutableCardTree(
            new MutableCard({
                updateAt: Date.parse('15 Jun 2021 16:22:00'),
            }),
        )

        const component = (
            <CardTreeContext.Provider value={cardTree}>
                <LastModifiedAt/>
            </CardTreeContext.Provider>
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
