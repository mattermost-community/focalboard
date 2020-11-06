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

    private rawBlocks: IBlock[] = []

    async sync() {
        const rawBoards = await octoClient.getBlocksWithType('board')
        const rawViews = await octoClient.getBlocksWithType('view')
        this.rawBlocks = [...rawBoards, ...rawViews]
        this.rebuild(OctoUtils.hydrateBlocks(this.rawBlocks))
    }

    incrementalUpdate(updatedBlocks: IBlock[]) {
        const relevantBlocks = updatedBlocks.filter((block) => block.type === 'board' || block.type === 'view')
        if (relevantBlocks.length < 1) {
            return
        }
        this.rawBlocks = OctoUtils.mergeBlocks(this.rawBlocks, updatedBlocks)
        this.rebuild(OctoUtils.hydrateBlocks(this.rawBlocks))
    }

    private rebuild(blocks: IBlock[]) {
        this.boards = blocks.filter((block) => block.type === 'board') as Board[]
        this.views = blocks.filter((block) => block.type === 'view') as BoardView[]
    }

    mutableCopy(): MutableWorkspaceTree {
        const workspaceTree = new MutableWorkspaceTree()
        workspaceTree.incrementalUpdate(this.rawBlocks)
        return workspaceTree
    }
}

export {MutableWorkspaceTree, WorkspaceTree}
