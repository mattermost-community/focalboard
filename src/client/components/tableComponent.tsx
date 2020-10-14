import React from "react"
import { Archiver } from "../archiver"
import { Block } from "../block"
import { BlockIcons } from "../blockIcons"
import { IPropertyTemplate } from "../board"
import { BoardTree } from "../boardTree"
import { CsvExporter } from "../csvExporter"
import { Menu } from "../menu"
import { Mutator } from "../mutator"
import { IBlock, IPageController } from "../octoTypes"
import { OctoUtils } from "../octoUtils"
import { Utils } from "../utils"
import { Button } from "./button"
import { Editable } from "./editable"
import { TableRow } from "./tableRow"

type Props = {
	mutator: Mutator,
	boardTree?: BoardTree
	pageController: IPageController
}

type State = {
	isHoverOnCover: boolean
	isSearching: boolean
}

class TableComponent extends React.Component<Props, State> {
	private draggedHeaderTemplate: IPropertyTemplate
	private cardIdToRowMap = new Map<string, React.RefObject<TableRow>>()
	private cardIdToFocusOnRender: string
	private searchFieldRef = React.createRef<Editable>()

	constructor(props: Props) {
		super(props)
		this.state = { isHoverOnCover: false, isSearching: !!this.props.boardTree?.getSearchText() }
	}

	componentDidUpdate(prevPros: Props, prevState: State) {
		if (this.state.isSearching && !prevState.isSearching) {
			this.searchFieldRef.current.focus()
		}
	}

	render() {
		const { mutator, boardTree, pageController } = this.props

		if (!boardTree || !boardTree.board) {
			return (
				<div>Loading...</div>
			)
		}

		const { board, cards, activeView } = boardTree

		const hasFilter = activeView.filter && activeView.filter.filters?.length > 0
		const hasSort = activeView.sortOptions.length > 0

		this.cardIdToRowMap.clear()

		return (
			<div className="octo-app">
				<div className="octo-frame">
					<div
						className="octo-hovercontrols"
						onMouseOver={() => { this.setState({ ...this.state, isHoverOnCover: true }) }}
						onMouseLeave={() => { this.setState({ ...this.state, isHoverOnCover: false }) }}
					>
						<Button
							style={{ display: (!board.icon && this.state.isHoverOnCover) ? null : "none" }}
							onClick={() => {
								const newIcon = BlockIcons.shared.randomIcon()
								mutator.changeIcon(board, newIcon)
							}}
						>Add Icon</Button>
					</div>

					<div className="octo-icontitle">
						{board.icon ?
							<div className="octo-button octo-icon" onClick={(e) => { this.iconClicked(e) }}>{board.icon}</div>
							: undefined}
						<Editable className="title" text={board.title} placeholderText="Untitled Board" onChanged={(text) => { mutator.changeTitle(board, text) }} />
					</div>

					<div className="octo-table">
						<div className="octo-controls">
							<Editable style={{ color: "#000000", fontWeight: 600 }} text={activeView.title} placeholderText="Untitled View" onChanged={(text) => { mutator.changeTitle(activeView, text) }} />
							<div className="octo-button" style={{ color: "#000000", fontWeight: 600 }} onClick={(e) => { OctoUtils.showViewMenu(e, mutator, boardTree, pageController) }}><div className="imageDropdown"></div></div>
							<div className="octo-spacer"></div>
							<div className="octo-button" onClick={(e) => { this.propertiesClicked(e) }}>Properties</div>
							<div className={ hasFilter ? "octo-button active" : "octo-button"} onClick={(e) => { this.filterClicked(e) }}>Filter</div>
							<div className={ hasSort ? "octo-button active" : "octo-button"} onClick={(e) => { OctoUtils.showSortMenu(e, mutator, boardTree) }}>Sort</div>
							{this.state.isSearching
								? <Editable
									ref={this.searchFieldRef}
									text={boardTree.getSearchText()}
									placeholderText="Search text"
									style={{ color: "#000000" }}
									onChanged={(text) => { this.searchChanged(text) }}
									onKeyDown={(e) => { this.onSearchKeyDown(e) }}></Editable>
								: <div className="octo-button" onClick={() => { this.setState({ ...this.state, isSearching: true }) }}>Search</div>
							}
							<div className="octo-button" onClick={(e) => this.optionsClicked(e)}><div className="imageOptions"></div></div>
							<div className="octo-button filled" onClick={() => { this.addCard(true) }}>New</div>
						</div>

						{/* Main content */}

						<div className="octo-table-body">

							{/* Headers */}

							<div className="octo-table-header" id="mainBoardHeader">
								<div className="octo-table-cell title-cell" id="mainBoardHeader">
									<div
										className="octo-label"
										style={{ cursor: "pointer" }}
										onClick={(e) => { this.headerClicked(e, "__name") }}
									>Name</div>
								</div>

								{board.cardProperties
									.filter(template => activeView.visiblePropertyIds.includes(template.id))
									.map(template =>
										<div
											key={template.id}
											className="octo-table-cell"

											draggable={true}
											onDragStart={() => { this.draggedHeaderTemplate = template }}
											onDragEnd={() => { this.draggedHeaderTemplate = undefined }}

											onDragOver={(e) => { e.preventDefault(); (e.target as HTMLElement).classList.add("dragover") }}
											onDragEnter={(e) => { e.preventDefault(); (e.target as HTMLElement).classList.add("dragover") }}
											onDragLeave={(e) => { e.preventDefault(); (e.target as HTMLElement).classList.remove("dragover") }}
											onDrop={(e) => { e.preventDefault(); (e.target as HTMLElement).classList.remove("dragover"); this.onDropToColumn(template) }}
										>
											<div
												className="octo-label"
												style={{ cursor: "pointer" }}
												onClick={(e) => { this.headerClicked(e, template.id) }}
											>{template.name}</div>
										</div>
									)}
							</div>

							{/* Rows, one per card */}

							{cards.map(card => {

								const openButonRef = React.createRef<HTMLDivElement>()
								const tableRowRef = React.createRef<TableRow>()

								let focusOnMount = false
								if (this.cardIdToFocusOnRender && this.cardIdToFocusOnRender === card.id) {
									this.cardIdToFocusOnRender = undefined
									focusOnMount = true
								}

								const tableRow = <TableRow
									key={card.id}
									ref={tableRowRef}
									mutator={mutator}
									boardTree={boardTree}
									card={card}
									focusOnMount={focusOnMount}
									showCard={(c) => { this.showCard(c) }}
									onKeyDown={(e) => {
										if (e.keyCode === 13) {
											// Enter: Insert new card if on last row
											if (cards.length > 0 && cards[cards.length - 1] === card) {
												this.addCard(false)
											}
										}
									}}
								></TableRow>

								this.cardIdToRowMap.set(card.id, tableRowRef)

								return tableRow
							})}

							{/* Add New row */}

							<div className="octo-table-footer">
								<div className="octo-table-cell" onClick={() => { this.addCard() }}>
									+ New
								</div>
							</div>
						</div>
					</div>
				</div >
			</div >
		)
	}

	private iconClicked(e: React.MouseEvent) {
		const { mutator, boardTree } = this.props
		const { board } = boardTree

		Menu.shared.options = [
			{ id: "random", name: "Random" },
			{ id: "remove", name: "Remove Icon" },
		]
		Menu.shared.onMenuClicked = (optionId: string, type?: string) => {
			switch (optionId) {
				case "remove":
					mutator.changeIcon(board, undefined, "remove icon")
					break
				case "random":
					const newIcon = BlockIcons.shared.randomIcon()
					mutator.changeIcon(board, newIcon)
					break
			}
		}
		Menu.shared.showAtElement(e.target as HTMLElement)
	}

	private async propertiesClicked(e: React.MouseEvent) {
		const { mutator, boardTree } = this.props
		const { activeView } = boardTree

		const selectProperties = boardTree.board.cardProperties
		Menu.shared.options = selectProperties.map((o) => {
			const isVisible = activeView.visiblePropertyIds.includes(o.id)
			return { id: o.id, name: o.name, type: "switch", isOn: isVisible }
		})

		Menu.shared.onMenuToggled = async (id: string, isOn: boolean) => {
			const property = selectProperties.find(o => o.id === id)
			Utils.assertValue(property)
			Utils.log(`Toggle property ${property.name} ${isOn}`)

			let newVisiblePropertyIds = []
			if (activeView.visiblePropertyIds.includes(id)) {
				newVisiblePropertyIds = activeView.visiblePropertyIds.filter(o => o !== id)
			} else {
				newVisiblePropertyIds = [...activeView.visiblePropertyIds, id]
			}
			await mutator.changeViewVisibleProperties(activeView, newVisiblePropertyIds)
		}
		Menu.shared.showAtElement(e.target as HTMLElement)
	}

	private filterClicked(e: React.MouseEvent) {
		const { pageController } = this.props
		pageController.showFilter(e.target as HTMLElement)
	}

	private async optionsClicked(e: React.MouseEvent) {
		const { boardTree } = this.props

		Menu.shared.options = [
			{ id: "exportCsv", name: "Export to CSV" },
			{ id: "exportBoardArchive", name: "Export board archive" },
		]

		Menu.shared.onMenuClicked = async (id: string) => {
			switch (id) {
				case "exportCsv": {
					CsvExporter.exportTableCsv(boardTree)
					break
				}
				case "exportBoardArchive": {
					Archiver.exportBoardTree(boardTree)
					break
				}
			}
		}
		Menu.shared.showAtElement(e.target as HTMLElement)
	}

	private async headerClicked(e: React.MouseEvent<HTMLDivElement>, templateId: string) {
		const { mutator, boardTree } = this.props
		const { board } = boardTree
		const { activeView } = boardTree

		const options = [
			{ id: "sortAscending", name: "Sort ascending" },
			{ id: "sortDescending", name: "Sort descending" },
			{ id: "insertLeft", name: "Insert left" },
			{ id: "insertRight", name: "Insert right" }
		]

		if (templateId !== "__name") {
			options.push({ id: "hide", name: "Hide" })
			options.push({ id: "duplicate", name: "Duplicate" })
			options.push({ id: "delete", name: "Delete" })
		}

		Menu.shared.options = options
		Menu.shared.onMenuClicked = async (optionId: string, type?: string) => {
			switch (optionId) {
				case "sortAscending": {
					const newSortOptions = [
						{ propertyId: templateId, reversed: false }
					]
					await mutator.changeViewSortOptions(activeView, newSortOptions)
					break
				}
				case "sortDescending": {
					const newSortOptions = [
						{ propertyId: templateId, reversed: true }
					]
					await mutator.changeViewSortOptions(activeView, newSortOptions)
					break
				}
				case "insertLeft": {
					if (templateId !== "__name") {
						const index = board.cardProperties.findIndex(o => o.id === templateId)
						await mutator.insertPropertyTemplate(boardTree, index)
					} else {
						// TODO: Handle name column
					}
					break
				}
				case "insertRight": {
					if (templateId !== "__name") {
						const index = board.cardProperties.findIndex(o => o.id === templateId) + 1
						await mutator.insertPropertyTemplate(boardTree, index)
					} else {
						// TODO: Handle name column
					}
					break
				}
				case "duplicate": {
					await mutator.duplicatePropertyTemplate(boardTree, templateId)
					break
				}
				case "hide": {
					const newVisiblePropertyIds = activeView.visiblePropertyIds.filter(o => o !== templateId)
					await mutator.changeViewVisibleProperties(activeView, newVisiblePropertyIds)
					break
				}
				case "delete": {
					await mutator.deleteProperty(boardTree, templateId)
					break
				}
				default: {
					Utils.assertFailure(`Unexpected menu option: ${optionId}`)
					break
				}
			}
		}
		Menu.shared.showAtElement(e.target as HTMLElement)
	}

	async showCard(card: IBlock) {
		console.log(`showCard: ${card.title}`)

		await this.props.pageController.showCard(card)
	}

	focusOnCardTitle(cardId: string) {
		const tableRowRef = this.cardIdToRowMap.get(cardId)
		Utils.log(`focusOnCardTitle, ${tableRowRef?.current ?? "undefined"}`)
		tableRowRef?.current.focusOnTitle()
	}

	async addCard(show: boolean = false) {
		const { mutator, boardTree } = this.props

		const card = new Block({ type: "card", parentId: boardTree.board.id })
		await mutator.insertBlock(
			card,
			"add card",
			async () => {
				if (show) {
					this.showCard(card)
				} else {
					// Focus on this card's title inline on next render
					this.cardIdToFocusOnRender = card.id
				}
			}
		)
	}

	private async onDropToColumn(template: IPropertyTemplate) {
		const { draggedHeaderTemplate } = this
		if (!draggedHeaderTemplate) { return }

		const { mutator, boardTree } = this.props
		const { board } = boardTree

		Utils.assertValue(mutator)
		Utils.assertValue(boardTree)

		Utils.log(`ondrop. Source column: ${draggedHeaderTemplate.name}, dest column: ${template.name}`)

		// Move template to new index
		const destIndex = template ? board.cardProperties.indexOf(template) : 0
		await mutator.changePropertyTemplateOrder(board, draggedHeaderTemplate, destIndex)
	}

	onSearchKeyDown(e: React.KeyboardEvent) {
		if (e.keyCode === 27) {		// ESC: Clear search
			this.searchFieldRef.current.text = ""
			this.setState({ ...this.state, isSearching: false })
			this.props.pageController.setSearchText(undefined)
			e.preventDefault()
		}
	}

	searchChanged(text?: string) {
		this.props.pageController.setSearchText(text)
	}
}

export { TableComponent }
