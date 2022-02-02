// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Disable console log
console.log = jest.fn()

import {Block} from './blocks/block'
import {createBoard} from './blocks/board'
import octoClient from './octoClient'
import 'isomorphic-fetch'
import {FetchMock} from './test/fetchMock'

global.fetch = FetchMock.fn

beforeEach(() => {
    FetchMock.fn.mockReset()
})

test('OctoClient: get blocks', async () => {
    const blocks = createBoards()

    FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify(blocks)))
    let boards = await octoClient.getBlocksWithType('board')
    expect(boards.length).toBe(blocks.length)

    FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify(blocks)))
    boards = await octoClient.getSubtree()
    expect(boards.length).toBe(blocks.length)

    FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify(blocks)))
    const response = await octoClient.exportArchive()
    expect(response.status).toBe(200)

    FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify(blocks)))
    const parentId = 'id1'
    boards = await octoClient.getBlocksWithParent(parentId)
    expect(boards.length).toBe(blocks.length)

    FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify(blocks)))
    boards = await octoClient.getBlocksWithParent(parentId, 'board')
    expect(boards.length).toBe(blocks.length)
})

test('OctoClient: insert blocks', async () => {
    const blocks = createBoards()

    await octoClient.insertBlocks(blocks)

    expect(FetchMock.fn).toBeCalledTimes(1)
    expect(FetchMock.fn).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(blocks),
        }))
})

function createBoards(): Block[] {
    const blocks = []

    for (let i = 0; i < 5; i++) {
        const board = createBoard()
        board.id = `board${i + 1}`
        blocks.push(board)
    }

    return blocks
}
