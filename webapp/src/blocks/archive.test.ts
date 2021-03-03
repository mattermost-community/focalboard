// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {TestBlockFactory} from '../test/testBlockFactory'

import {ArchiveUtils} from './archive'
import {IBlock} from './block'

test('archive: archive and unarchive', async () => {
    const blocks: IBlock[] = []

    const board = TestBlockFactory.createBoard()
    blocks.push(board)
    blocks.push(TestBlockFactory.createBoardView(board))
    const card = TestBlockFactory.createCard(board)
    blocks.push(card)
    blocks.push(TestBlockFactory.createText(card))
    blocks.push(TestBlockFactory.createDivider(card))
    blocks.push(TestBlockFactory.createImage(card))

    const archive = ArchiveUtils.buildBlockArchive(blocks)
    const unarchivedBlocks = ArchiveUtils.parseBlockArchive(archive)

    expect(unarchivedBlocks).toEqual(blocks)
})
