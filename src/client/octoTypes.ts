// A block is the fundamental data type
interface IBlock {
	id: string
	parentId: string

	type: string
	title?: string
	url?: string			// TODO: Move to properties (_url)
	icon?: string
	order: number
	properties: Record<string, string>

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
