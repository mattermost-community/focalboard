import { Card } from "./card"

// A block is the fundamental data type
interface IBlock {
	id: string
	parentId: string

	schema: number
	type: string
	title?: string
	order: number
	fields: Record<string, any>

	createAt: number
	updateAt: number
	deleteAt: number
}

// These are methods exposed by the top-level page to components
interface IPageController {
	showBoard(boardId: string): void
	showView(viewId: string): void
	showFilter(anchorElement?: HTMLElement): void
	setSearchText(text?: string): void
}

export { IBlock, IPageController }
