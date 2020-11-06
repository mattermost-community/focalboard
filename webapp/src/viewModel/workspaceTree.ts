// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Board} from '../blocks/board'
import octoClient from '../octoClient'
import {IBlock} from '../blocks/block'
import {OctoUtils} from '../octoUtils'
import {BoardView} from '../blocks/boardView'

interface WorkspaceTree {
    readonly boards: readonly Board[]
    readonly views: readonly BoardView[]

    mutableCopy(): MutableWorkspaceTree
}

class MutableWorkspaceTree {
    boards: Board[] = []
    views: BoardView[] = []

    private rawBoards: IBlock[] = []
    private rawViews: IBlock[] = []

    async sync() {
        this.rawBoards = await octoClient.getBlocksWithType('board')
        this.rawViews = await octoClient.getBlocksWithType('view')
        this.rebuild(
            OctoUtils.hydrateBlocks(this.rawBoards),
            OctoUtils.hydrateBlocks(this.rawViews),
        )
    }

    incrementalUpdate(updatedBlocks: IBlock[]) {
        const updatedBoards = updatedBlocks.filter((o) => o.type === 'board')
        const updatedViews = updatedBlocks.filter((o) => o.type === 'view')

        this.rawBoards = OctoUtils.mergeBlocks(this.rawBoards, updatedBoards)
        this.rawViews = OctoUtils.mergeBlocks(this.rawViews, updatedViews)
        this.rebuild(
            OctoUtils.hydrateBlocks(this.rawBoards),
            OctoUtils.hydrateBlocks(this.rawViews),
        )
    }

    private rebuild(boards: IBlock[], views: IBlock[]) {
        this.boards = boards.filter((block) => block.type === 'board') as Board[]
        this.views = views.filter((block) => block.type === 'view') as BoardView[]
    }

    mutableCopy(): MutableWorkspaceTree {
        const workspaceTree = new MutableWorkspaceTree()
        const rawBlocks = [...this.rawBoards, ...this.rawViews]
        workspaceTree.incrementalUpdate(rawBlocks)
        return workspaceTree
    }
}

export {MutableWorkspaceTree, WorkspaceTree}
