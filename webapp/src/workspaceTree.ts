// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Block} from './blocks/block'
import {Board} from './blocks/board'
import octoClient from './octoClient'
import {OctoUtils} from './octoUtils'

interface WorkspaceTree {
	readonly boards: readonly Board[]
}

class MutableWorkspaceTree {
	boards: Board[] = []

	async sync() {
		const blocks = await octoClient.getBlocks(undefined, "board")
		this.rebuild(OctoUtils.hydrateBlocks(blocks))
	}

	private rebuild(blocks: Block[]) {
		this.boards = blocks.filter(block => block.type === "board") as Board[]
	}
}

// type WorkspaceTree = Readonly<MutableWorkspaceTree>

export { MutableWorkspaceTree, WorkspaceTree }
