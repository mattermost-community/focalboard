// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {render} from '@testing-library/react'

import {wrapIntl} from '../../../testUtils'

import {createCard} from '../../../blocks/card'
import {createCommentBlock} from '../../../blocks/commentBlock'

import LastModifiedAt from './lastModifiedAt'

describe('componnets/properties/lastModifiedAt', () => {
    test('should match snapshot', () => {
        const card = createCard()
        card.id = 'card-id-1'
        card.modifiedBy = 'user-id-1'
        card.updateAt = Date.parse('10 Jun 2021 16:22:00')

        const comment = createCommentBlock()
        comment.modifiedBy = 'user-id-1'
        comment.parentId = 'card-id-1'
        comment.updateAt = Date.parse('15 Jun 2021 16:22:00')

        const component = wrapIntl(
            <LastModifiedAt
                card={card}
                contents={[]}
                comments={[comment]}
            />,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
