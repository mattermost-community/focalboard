import { Card } from "./card"
import { OctoClient } from "./octoClient"
import { IBlock } from "./octoTypes"

class CardTree {
	card: Card
	comments: IBlock[]
	contents: IBlock[]
	isSynched: boolean

	constructor(
		private octo: OctoClient,
		private cardId: string) {
	}

	async sync() {
		const blocks = await this.octo.getSubtree(this.cardId)
		this.rebuild(blocks)
	}

	private rebuild(blocks: IBlock[]) {
		this.card = new Card(blocks.find(o => o.id === this.cardId))

		this.comments = blocks
			.filter(block => block.type === "comment")
			.sort((a, b) => a.createAt - b.createAt)

		this.contents = blocks
			.filter(block => block.type === "text" || block.type === "image")
			.sort((a, b) => a.order - b.order)

		this.isSynched = true
	}
}

export { CardTree }
