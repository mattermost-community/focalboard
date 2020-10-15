import React from "react"
import { IPropertyTemplate } from "./board"
import { BoardTree } from "./boardTree"
import { ISortOption } from "./boardView"
import { Card } from "./card"
import { Editable } from "./components/editable"
import { Menu } from "./menu"
import { Mutator } from "./mutator"
import { IBlock } from "./octoTypes"
import { Utils } from "./utils"

class OctoUtils {
	static propertyDisplayValue(block: IBlock, propertyValue: string | undefined, propertyTemplate: IPropertyTemplate) {
		let displayValue: string
		switch (propertyTemplate.type) {
			case "createdTime":
				displayValue = Utils.displayDateTime(new Date(block.createAt))
				break
			case "updatedTime":
				displayValue = Utils.displayDateTime(new Date(block.updateAt))
				break
			default:
				displayValue = propertyValue
		}

		return displayValue
	}

	static propertyValueReadonlyElement(card: Card, propertyTemplate: IPropertyTemplate, emptyDisplayValue: string = "Empty"): JSX.Element {
		return this.propertyValueElement(undefined, card, propertyTemplate, emptyDisplayValue)
	}

	static propertyValueEditableElement(mutator: Mutator, card: Card, propertyTemplate: IPropertyTemplate, emptyDisplayValue?: string): JSX.Element {
		return this.propertyValueElement(mutator, card, propertyTemplate, emptyDisplayValue)
	}

	private static propertyValueElement(mutator: Mutator | undefined, card: Card, propertyTemplate: IPropertyTemplate, emptyDisplayValue: string = "Empty"): JSX.Element {
		const propertyValue = card.properties[propertyTemplate.id]
		const displayValue = OctoUtils.propertyDisplayValue(card, propertyValue, propertyTemplate)
		const finalDisplayValue = displayValue || emptyDisplayValue

		let propertyColorCssClassName: string
		if (propertyValue && propertyTemplate.type === "select") {
			const cardPropertyValue = propertyTemplate.options.find(o => o.value === propertyValue)
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
				icon: (sortOption?.propertyId === o.id) ? sortOption.reversed ? "sortUp" : "sortDown" : undefined
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
