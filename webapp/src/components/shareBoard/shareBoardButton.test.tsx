// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {render} from '@testing-library/react'
import React from 'react'

import {TestBlockFactory} from '../../test/testBlockFactory'
import {wrapDNDIntl} from '../../testUtils'

import ShareBoardButton from './shareBoardButton'

jest.useFakeTimers()

const boardId = '1'

const board = TestBlockFactory.createBoard()
board.id = boardId

describe('src/components/shareBoard/shareBoard', () => {
    test('should match snapshot', async () => {
        const result = render(
            wrapDNDIntl(
                <ShareBoardButton
                    boardId={board.id}
                    enableSharedBoards={true}
                />))

        const renderer = result.container

        expect(renderer).toMatchSnapshot()
    })
})
