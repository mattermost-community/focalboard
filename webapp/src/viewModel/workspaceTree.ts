// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IBlock} from '../blocks/block'
import {Board} from '../blocks/board'
import {BoardView} from '../blocks/boardView'
import octoClient from '../octoClient'
import {OctoUtils} from '../octoUtils'

interface WorkspaceTree {
    readonly boards: readonly Board[]
    readonly boardTemplates: readonly Board[]
    readonly views: readonly BoardView[]
    readonly allBlocks: readonly IBlock[]
}

class MutableWorkspaceTree {
    boards: Board[] = []
    boardTemplates: Board[] = []
    views: BoardView[] = []
    get allBlocks(): IBlock[] {
        return [...this.boards, ...this.boardTemplates, ...this.views]
    }

    // Factory methods

    static async sync(): Promise<WorkspaceTree> {
        const rawBoards = await octoClient.getBlocksWithType('board')
        const rawViews = await octoClient.getBlocksWithType('view')
        const rawBlocks = [...rawBoards, ...rawViews]
        return this.buildTree(rawBlocks)
    }

    static incrementalUpdate(workspaceTree: WorkspaceTree, updatedBlocks: IBlock[]): WorkspaceTree {
        const relevantBlocks = updatedBlocks.filter((block) => block.deleteAt !== 0 || block.type === 'board' || block.type === 'view')
        if (relevantBlocks.length < 1) {
            // No change
            return workspaceTree
        }
        const rawBlocks = OctoUtils.mergeBlocks(workspaceTree.allBlocks, relevantBlocks)
        return this.buildTree(rawBlocks)
    }

    private static buildTree(sourceBlocks: readonly IBlock[]): MutableWorkspaceTree {
        const blocks = OctoUtils.hydrateBlocks(sourceBlocks)

        const workspaceTree = new MutableWorkspaceTree()
        const allBoards = blocks.filter((block) => block.type === 'board') as Board[]
        workspaceTree.boards = allBoards.filter((block) => !block.isTemplate).
            sort((a, b) => a.title.localeCompare(b.title)) as Board[]
        workspaceTree.boardTemplates = allBoards.filter((block) => block.isTemplate).
            sort((a, b) => a.title.localeCompare(b.title)) as Board[]
        workspaceTree.views = blocks.filter((block) => block.type === 'view').
            sort((a, b) => a.title.localeCompare(b.title)) as BoardView[]

        return workspaceTree
    }

    private mutableCopy(): MutableWorkspaceTree {
        return MutableWorkspaceTree.buildTree(this.allBlocks)!
    }
}

export {MutableWorkspaceTree, WorkspaceTree}
