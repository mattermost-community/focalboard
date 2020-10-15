import { Board } from "./board"
import octoClient from "./octoClient"
import { IBlock } from "./octoTypes"

class WorkspaceTree {
	boards: Board[] = []

	async sync() {
		const blocks = await octoClient.getBlocks(undefined, "board")
		this.rebuild(blocks)
	}

	private rebuild(blocks: IBlock[]) {
		const boardBlocks = blocks.filter(block => block.type === "board")
		this.boards = boardBlocks.map(o => new Board(o))
	}
}

export { WorkspaceTree }
