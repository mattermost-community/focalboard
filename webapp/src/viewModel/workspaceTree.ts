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
}

class MutableWorkspaceTree {
    boards: Board[] = []
    views: BoardView[] = []

    async sync() {
        const boards = await octoClient.getBlocksWithType('board')
        const views = await octoClient.getBlocksWithType('view')
        this.rebuild(
            OctoUtils.hydrateBlocks(boards),
            OctoUtils.hydrateBlocks(views),
        )
    }

    private rebuild(boards: IBlock[], views: IBlock[]) {
        this.boards = boards.filter((block) => block.type === 'board') as Board[]
        this.views = views.filter((block) => block.type === 'view') as BoardView[]
    }
}

// type WorkspaceTree = Readonly<MutableWorkspaceTree>

export {MutableWorkspaceTree, WorkspaceTree}
