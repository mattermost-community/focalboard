// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IBlock} from '../blocks/block'
import {Board} from '../blocks/board'
import {BoardView} from '../blocks/boardView'
import octoClient from '../octoClient'
import {OctoUtils} from '../octoUtils'

interface WorkspaceTree {
    readonly boards: readonly Board[]
    readonly views: readonly BoardView[]

    mutableCopy(): MutableWorkspaceTree
}

class MutableWorkspaceTree {
    boards: Board[] = []
    views: BoardView[] = []

    private rawBlocks: IBlock[] = []

    async sync(): Promise<void> {
        const rawBoards = await octoClient.getBlocksWithType('board')
        const rawViews = await octoClient.getBlocksWithType('view')
        this.rawBlocks = [...rawBoards, ...rawViews]
        this.rebuild(OctoUtils.hydrateBlocks(this.rawBlocks))
    }

    incrementalUpdate(updatedBlocks: IBlock[]): boolean {
        const relevantBlocks = updatedBlocks.filter((block) => block.deleteAt !== 0 || block.type === 'board' || block.type === 'view')
        if (relevantBlocks.length < 1) {
            return false
        }
        this.rawBlocks = OctoUtils.mergeBlocks(this.rawBlocks, updatedBlocks)
        this.rebuild(OctoUtils.hydrateBlocks(this.rawBlocks))
        return true
    }

    private rebuild(blocks: IBlock[]) {
        this.boards = blocks.filter((block) => block.type === 'board').
            sort((a, b) => a.title.localeCompare(b.title)) as Board[]
        this.views = blocks.filter((block) => block.type === 'view').
            sort((a, b) => a.title.localeCompare(b.title)) as BoardView[]
    }

    mutableCopy(): MutableWorkspaceTree {
        const workspaceTree = new MutableWorkspaceTree()
        workspaceTree.incrementalUpdate(this.rawBlocks)
        return workspaceTree
    }
}

export {MutableWorkspaceTree, WorkspaceTree}
