import React from "react"
import { BoardTree } from "../boardTree"
import { Card } from "../card"
import mutator from "../mutator"
import { OctoUtils } from "../octoUtils"
import { Editable } from "./editable"

type Props = {
	boardTree: BoardTree
	card: Card
	focusOnMount: boolean
	showCard: (card: Card) => void
	onKeyDown: (e: React.KeyboardEvent) => void
}

type State = {
}

class TableRow extends React.Component<Props, State> {
	private titleRef = React.createRef<Editable>()

	componentDidMount() {
		if (this.props.focusOnMount) {
			this.titleRef.current.focus()
		}
	}

	render() {
		const { boardTree, card, showCard, onKeyDown } = this.props
		const { board, activeView } = boardTree

		const openButonRef = React.createRef<HTMLDivElement>()

		const element = <div className="octo-table-row" key={card.id}>

			{/* Name / title */}

			<div className="octo-table-cell title-cell" id="mainBoardHeader" onMouseOver={() => { openButonRef.current.style.display = null }} onMouseLeave={() => { openButonRef.current.style.display = "none" }}>
				<div className="octo-icontitle">
					<div className="octo-icon">{card.icon}</div>
					<Editable
						ref={this.titleRef}
						text={card.title}
						placeholderText="Untitled"
						onChanged={(text) => { mutator.changeTitle(card, text) }}
						onKeyDown={(e) => { onKeyDown(e) }}
					/>
				</div>

				<div ref={openButonRef} className="octo-hoverbutton" style={{ display: "none" }} onClick={() => { showCard(card) }}>Open</div>
			</div>

			{/* Columns, one per property */}

			{board.cardProperties
				.filter(template => activeView.visiblePropertyIds.includes(template.id))
				.map(template => {
					return <div className="octo-table-cell" key={template.id}>
						{OctoUtils.propertyValueEditableElement(card, template)}
					</div>
				})}
		</div>

		return element
	}

	focusOnTitle() {
		this.titleRef.current?.focus()
	}
}

export { TableRow }
