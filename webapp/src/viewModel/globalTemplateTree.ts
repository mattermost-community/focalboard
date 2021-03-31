// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IBlock} from '../blocks/block'
import {Board} from '../blocks/board'
import octoClient, {OctoClient} from '../octoClient'
import {OctoUtils} from '../octoUtils'

interface GlobalTemplateTree {
    readonly boardTemplates: readonly Board[]
    readonly allBlocks: readonly IBlock[]
}

class MutableGlobalTemplateTree implements GlobalTemplateTree {
    boardTemplates: Board[] = []
    get allBlocks(): IBlock[] {
        return [...this.boardTemplates]
    }

    // Factory methods

    static async sync(): Promise<GlobalTemplateTree> {
        const rootClient = new OctoClient(octoClient.serverUrl, '0')
        const rawBlocks = await rootClient.getBlocksWithType('board')

        return this.buildTree(rawBlocks)
    }

    static incrementalUpdate(originalTree: GlobalTemplateTree, updatedBlocks: IBlock[]): GlobalTemplateTree {
        const relevantBlocks = updatedBlocks.filter((block) => block.deleteAt !== 0 || block.type === 'board' || block.type === 'view')
        if (relevantBlocks.length < 1) {
            // No change
            return originalTree
        }
        const rawBlocks = OctoUtils.mergeBlocks(originalTree.allBlocks, relevantBlocks)
        return this.buildTree(rawBlocks)
    }

    private static buildTree(sourceBlocks: readonly IBlock[]): MutableGlobalTemplateTree {
        const blocks = OctoUtils.hydrateBlocks(sourceBlocks)

        const workspaceTree = new MutableGlobalTemplateTree()
        const allBoards = blocks.filter((block) => block.type === 'board') as Board[]
        workspaceTree.boardTemplates = allBoards.filter((block) => block.isTemplate).
            sort((a, b) => a.title.localeCompare(b.title)) as Board[]

        return workspaceTree
    }

    // private mutableCopy(): MutableWorkspaceTree {
    //     return MutableWorkspaceTree.buildTree(this.allBlocks)!
    // }
}

export {MutableGlobalTemplateTree, GlobalTemplateTree}
