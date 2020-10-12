import React from "react"
import { IPropertyTemplate } from "./board"
import { BoardTree } from "./boardTree"
import { BoardView, ISortOption } from "./boardView"
import { Editable } from "./components/editable"
import { Menu, MenuOption } from "./menu"
import { Mutator } from "./mutator"
import { IBlock, IPageController, IProperty } from "./octoTypes"
import { Utils } from "./utils"

class OctoUtils {
	static async showViewMenu(e: React.MouseEvent, mutator: Mutator, boardTree: BoardTree, pageController: IPageController) {
		const { board } = boardTree

		const options: MenuOption[] = boardTree.views.map(view => ({ id: view.id, name: view.title || "Untitled View" }))
		options.push({ id: "", name: "", type: "separator" })
		if (boardTree.views.length > 1) {
			options.push({ id: "__deleteView", name: "Delete View" })
		}
		options.push({ id: "__addview", name: "Add View", type: "submenu" })

		const addViewMenuOptions = [
			{ id: "board", name: "Board" },
			{ id: "table", name: "Table" }
		]
		Menu.shared.subMenuOptions.set("__addview", addViewMenuOptions)

		Menu.shared.options = options
		Menu.shared.onMenuClicked = async (optionId: string, type?: string) => {
			switch (optionId) {
				case "__deleteView": {
					Utils.log(`deleteView`)
					const view = boardTree.activeView
					const nextView = boardTree.views.find(o => o !== view)
					await mutator.deleteBlock(view, "delete view")
					pageController.showView(nextView.id)
					break
				}
				case "__addview-board": {
					Utils.log(`addview-board`)
					const view = new BoardView()
					view.title = "Board View"
					view.viewType = "board"
					view.parentId = board.id

					const oldViewId = boardTree.activeView.id

					await mutator.insertBlock(
						view,
						"add view",
						async () => { pageController.showView(view.id) },
						async () => { pageController.showView(oldViewId) })
					break
				}
				case "__addview-table": {
					Utils.log(`addview-table`)
					const view = new BoardView()
					view.title = "Table View"
					view.viewType = "table"
					view.parentId = board.id
					view.visiblePropertyIds = board.cardProperties.map(o => o.id)

					const oldViewId = boardTree.activeView.id

					await mutator.insertBlock(
						view,
						"add view",
						async () => { pageController.showView(view.id) },
						async () => { pageController.showView(oldViewId) })
					break
				}
				default: {
					const view = boardTree.views.find(o => o.id === optionId)
					pageController.showView(view.id)
				}
			}
		}
		Menu.shared.showAtElement(e.target as HTMLElement)
	}

	static propertyDisplayValue(block: IBlock, property: IProperty, propertyTemplate: IPropertyTemplate) {
		let displayValue: string
		switch (propertyTemplate.type) {
			case "createdTime":
				displayValue = Utils.displayDateTime(new Date(block.createAt))
				break
			case "updatedTime":
				displayValue = Utils.displayDateTime(new Date(block.updateAt))
				break
			default:
				displayValue = property ? property.value : undefined
		}

		return displayValue
	}

	static propertyValueReadonlyElement(card: IBlock, propertyTemplate: IPropertyTemplate, emptyDisplayValue: string = "Empty"): JSX.Element {
		return this.propertyValueElement(undefined, card, propertyTemplate, emptyDisplayValue)
	}

	static propertyValueEditableElement(mutator: Mutator, card: IBlock, propertyTemplate: IPropertyTemplate, emptyDisplayValue?: string): JSX.Element {
		return this.propertyValueElement(mutator, card, propertyTemplate, emptyDisplayValue)
	}

	private static propertyValueElement(mutator: Mutator | undefined, card: IBlock, propertyTemplate: IPropertyTemplate, emptyDisplayValue: string = "Empty"): JSX.Element {
		const property = card.properties.find(o => o.id === propertyTemplate.id)
		const displayValue = OctoUtils.propertyDisplayValue(card, property, propertyTemplate)
		const finalDisplayValue = displayValue || emptyDisplayValue

		let propertyColorCssClassName: string
		if (property && propertyTemplate.type === "select") {
			const cardPropertyValue = propertyTemplate.options.find(o => o.value === property.value)
			if (cardPropertyValue) {
				propertyColorCssClassName = cardPropertyValue.color
			}
		}

		let element: JSX.Element

		if (propertyTemplate.type === "select") {
			let className = "octo-button octo-propertyvalue"
			if (!displayValue) { className += " empty" }

			const showMenu = (clickedElement: HTMLElement) => {
				if (propertyTemplate.options.length < 1) { return }

				const menu = Menu.shared
				menu.options = [{ id: "", name: "<Empty>" }]
				menu.options.push(...propertyTemplate.options.map(o => ({ id: o.value, name: o.value })))
				menu.onMenuClicked = (optionId) => {
					mutator.changePropertyValue(card, propertyTemplate.id, optionId)
				}
				menu.showAtElement(clickedElement)
			}

			element = <div
				key={propertyTemplate.id}
				className={`${className} ${propertyColorCssClassName}`}
				tabIndex={0}
				onClick={mutator ? (e) => { showMenu(e.target as HTMLElement) } : undefined}
				onKeyDown={mutator ? (e) => {
					if (e.keyCode === 13) {
						showMenu(e.target as HTMLElement)
					}
				} : undefined}
				onFocus={mutator ? () => { Menu.shared.hide() } : undefined}
			>
				{finalDisplayValue}
			</div>
		} else if (propertyTemplate.type === "text" || propertyTemplate.type === "number") {
			if (mutator) {
				element = <Editable
					key={propertyTemplate.id}
					className="octo-propertyvalue"
					placeholderText="Empty"
					text={displayValue}
					onChanged={(text) => {
						mutator.changePropertyValue(card, propertyTemplate.id, text)
					}}
				></Editable>
			} else {
				element = <div key={propertyTemplate.id} className="octo-propertyvalue">{displayValue}</div>
			}
		} else {
			element = <div
				key={propertyTemplate.id}
				className="octo-propertyvalue"
			>{finalDisplayValue}</div>
		}

		return element
	}

	static getOrderBefore(block: IBlock, blocks: IBlock[]): number {
		const index = blocks.indexOf(block)
		if (index === 0) {
			return block.order / 2
		}
		const previousBlock = blocks[index - 1]
		return (block.order + previousBlock.order) / 2
	}

	static getOrderAfter(block: IBlock, blocks: IBlock[]): number {
		const index = blocks.indexOf(block)
		if (index === blocks.length - 1) {
			return block.order + 1000
		}
		const nextBlock = blocks[index + 1]
		return (block.order + nextBlock.order) / 2
	}

	static showSortMenu(e: React.MouseEvent, mutator: Mutator, boardTree: BoardTree) {
		const { activeView } = boardTree
		const { sortOptions } = activeView
		const sortOption = sortOptions.length > 0 ? sortOptions[0] : undefined

		const propertyTemplates = boardTree.board.cardProperties
		Menu.shared.options = propertyTemplates.map((o) => {
			return {
				id: o.id,
				name: o.name,
				icon: (sortOption.propertyId === o.id) ? sortOption.reversed ? "sortUp" : "sortDown" : undefined
			}
		})
		Menu.shared.onMenuClicked = async (propertyId: string) => {
			let newSortOptions: ISortOption[] = []
			if (sortOption && sortOption.propertyId === propertyId) {
				// Already sorting by name, so reverse it
				newSortOptions = [
					{ propertyId, reversed: !sortOption.reversed }
				]
			} else {
				newSortOptions = [
					{ propertyId, reversed: false }
				]
			}

			await mutator.changeViewSortOptions(activeView, newSortOptions)
		}
		Menu.shared.showAtElement(e.target as HTMLElement)
	}
}

export { OctoUtils }
