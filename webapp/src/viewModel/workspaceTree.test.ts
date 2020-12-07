// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
console.log = jest.fn()

import 'isomorphic-fetch'
import {TestBlockFactory} from '../test/block'

import {MutableWorkspaceTree} from './workspaceTree'

const fetchMock = jest.fn(async () => {
    const response = new Response()
    return response
})

global.fetch = fetchMock

beforeEach(() => {
    fetchMock.mockReset()
})

test('WorkspaceTree', async () => {
    const board = TestBlockFactory.createBoard()
    const boardTemplate = TestBlockFactory.createBoard()
    boardTemplate.isTemplate = true
    const view = TestBlockFactory.createBoardView()

    // Sync
    fetchMock.mockReturnValueOnce(jsonResponse(JSON.stringify([board, boardTemplate])))
    fetchMock.mockReturnValueOnce(jsonResponse(JSON.stringify([view])))
    const workspaceTree = new MutableWorkspaceTree()
    await workspaceTree.sync()

    expect(fetchMock).toBeCalledTimes(2)
    expect(workspaceTree.boards).toEqual([board])
    expect(workspaceTree.boardTemplates).toEqual([boardTemplate])
    expect(workspaceTree.views).toEqual([view])

    // Incremental update
    const board2 = TestBlockFactory.createBoard()
    const boardTemplate2 = TestBlockFactory.createBoard()
    boardTemplate2.isTemplate = true
    const view2 = TestBlockFactory.createBoardView()

    expect(workspaceTree.incrementalUpdate([board2, boardTemplate2, view2])).toBe(true)
    expect(workspaceTree.boards).toEqual([board, board2])
    expect(workspaceTree.boardTemplates).toEqual([boardTemplate, boardTemplate2])
    expect(workspaceTree.views).toEqual([view, view2])

    // Incremental update: No change
    const card = TestBlockFactory.createCard()
    expect(workspaceTree.incrementalUpdate([card])).toBe(false)
    expect(workspaceTree.boards).toEqual([board, board2])
    expect(workspaceTree.boardTemplates).toEqual([boardTemplate, boardTemplate2])
    expect(workspaceTree.views).toEqual([view, view2])

    // Copy
    const workspaceTree2 = workspaceTree.mutableCopy()
    expect(workspaceTree2).toEqual(workspaceTree)
    expect(workspaceTree2.boards).toEqual(workspaceTree.boards)
    expect(workspaceTree2.boardTemplates).toEqual(workspaceTree.boardTemplates)
    expect(workspaceTree2.views).toEqual(workspaceTree.views)
})

async function jsonResponse(json: string) {
    const response = new Response(json)
    return response
}
