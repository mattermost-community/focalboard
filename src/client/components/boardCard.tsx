import React from "react"
import { Block } from "../block"
import { IPropertyTemplate } from "../board"
import { Card } from "../card"
import { Menu } from "../menu"
import mutator from "../mutator"
import { OctoUtils } from "../octoUtils"
import { Utils } from "../utils"

type BoardCardProps = {
	card: Card
	visiblePropertyTemplates: IPropertyTemplate[]
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
	onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void
	onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void
}

type BoardCardState = {
	isDragged?: boolean
}

class BoardCard extends React.Component<BoardCardProps, BoardCardState> {

	constructor(props: BoardCardProps) {
		super(props)
		this.state = {}
	}

	render() {
		const { card } = this.props
		const optionsButtonRef = React.createRef<HTMLDivElement>()
		const visiblePropertyTemplates = this.props.visiblePropertyTemplates || []
		const element =
			<div
				className="octo-board-card"
				draggable={true}
				style={{ opacity: this.state.isDragged ? 0.5 : 1 }}
				onClick={this.props.onClick}
				onDragStart={(e) => { this.setState({ isDragged: true }); this.props.onDragStart(e) }}
				onDragEnd={(e) => { this.setState({ isDragged: false }); this.props.onDragEnd(e) }}

				onMouseOver={() => { optionsButtonRef.current.style.display = null }}
				onMouseLeave={() => { optionsButtonRef.current.style.display = "none" }}
			>
				<div ref={optionsButtonRef} className="octo-hoverbutton square" style={{ display: "none" }} onClick={(e) => { this.showOptionsMenu(e) }}><div className="imageOptions" /></div>

				<div className="octo-icontitle">
					{ card.icon ? <div className="octo-icon">{card.icon}</div> : undefined }
					<div key="__title">{card.title || "Untitled"}</div>
				</div>
				{visiblePropertyTemplates.map(template => {
					return OctoUtils.propertyValueReadonlyElement(card, template, "")
				})}
			</div>

		return element
	}

	private showOptionsMenu(e: React.MouseEvent) {
		const { card } = this.props

		e.stopPropagation()

		Menu.shared.options = [
			{ id: "delete", name: "Delete" },
			{ id: "duplicate", name: "Duplicate" }
		]
		Menu.shared.onMenuClicked = (id) => {
			switch (id) {
				case "delete": {
					mutator.deleteBlock(card, "delete card")
					break
				}
				case "duplicate": {
					const newCard = Block.duplicate(card)
					mutator.insertBlock(newCard, "duplicate card")
					break
				}
				default: {
					Utils.assertFailure(`Unhandled menu id: ${id}`)
				}
			}
		}
		Menu.shared.showAtElement(e.target as HTMLElement)
	}
}

export { BoardCard }
