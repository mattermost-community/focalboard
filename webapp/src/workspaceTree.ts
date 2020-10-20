import { Block } from "./blocks/block"
import { Board } from "./blocks/board"
import octoClient from "./octoClient"
import { OctoUtils } from "./octoUtils"

class WorkspaceTree {
	boards: Board[] = []

	async sync() {
		const blocks = await octoClient.getBlocks(undefined, "board")
		this.rebuild(OctoUtils.hydrateBlocks(blocks))
	}

	private rebuild(blocks: Block[]) {
		this.boards = blocks.filter(block => block.type === "board") as Board[]
	}
}

export { WorkspaceTree }
