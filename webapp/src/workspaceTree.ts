// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Board} from './blocks/board'
import octoClient from './octoClient'
import { IBlock } from './octoTypes'
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

	private rebuild(blocks: IBlock[]) {
		this.boards = blocks.filter(block => block.type === "board") as Board[]
	}
}

// type WorkspaceTree = Readonly<MutableWorkspaceTree>

export { MutableWorkspaceTree, WorkspaceTree }
