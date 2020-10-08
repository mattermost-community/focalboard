// A property on a bock
interface IProperty {
	id: string
	value?: string
}

// A block is the fundamental data type
interface IBlock {
	id: string
	parentId: string

	type: string
	title?: string
	url?: string
	icon?: string
	order: number
	properties: IProperty[]

	createAt: number
	updateAt: number
	deleteAt: number
}

// These are methods exposed by the top-level page to components
interface IPageController {
	showCard(card: IBlock): Promise<void>
	showView(viewId: string): void
	showFilter(anchorElement?: HTMLElement): void
}

export { IProperty, IBlock, IPageController }
