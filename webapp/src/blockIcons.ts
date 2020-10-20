import { randomEmojiList } from "./emojiList"

class BlockIcons {
	static readonly shared = new BlockIcons()

	randomIcon(): string {
		const index = Math.floor(Math.random() * randomEmojiList.length)
		const icon = randomEmojiList[index]
		return icon
	}
}

export { BlockIcons }
