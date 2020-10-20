import { Block } from "./block"

class CommentBlock extends Block {
	constructor(block: any = {}) {
		super(block)
		this.type = "comment"
	}
}

export { CommentBlock }
