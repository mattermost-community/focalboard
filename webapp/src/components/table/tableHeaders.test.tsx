// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {render} from '@testing-library/react'
import '@testing-library/jest-dom'

import 'isomorphic-fetch'
import {wrapDNDIntl} from '../../testUtils'

import {TestBlockFactory} from '../../test/testBlockFactory'

import TableHeaders from './tableHeaders'

describe('components/table/TableHeaders', () => {
    const board = TestBlockFactory.createBoard()
    const card = TestBlockFactory.createCard(board)
    const view = TestBlockFactory.createBoardView(board)

    test('should match snapshot', async () => {
        const component = wrapDNDIntl(
            <TableHeaders
                board={board}
                cards={[card]}
                activeView={view}
                views={[view]}
                readonly={false}
                resizingColumn=''
                offset={0}
                columnRefs={new Map()}
            />,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
