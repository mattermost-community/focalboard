import { Board } from "./board"
import { OctoClient } from "./octoClient"
import { IBlock } from "./octoTypes"

class WorkspaceTree {
	boards: Board[] = []

	constructor(
		private octo: OctoClient) {
	}

	async sync() {
		const blocks = await this.octo.getBlocks(undefined, "board")
		this.rebuild(blocks)
	}

	private rebuild(blocks: IBlock[]) {
		const boardBlocks = blocks.filter(block => block.type === "board")
		this.boards = boardBlocks.map(o => new Board(o))
	}
}

export { WorkspaceTree }
