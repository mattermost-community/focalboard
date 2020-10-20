import React from "react"
import { BoardTree } from "../boardTree"
import { Card } from "../blocks/card"
import mutator from "../mutator"
import { OctoUtils } from "../octoUtils"
import { Editable } from "./editable"
import { CardDialog } from "./cardDialog"
import RootPortal from "./rootPortal"

type Props = {
	boardTree: BoardTree
	card: Card
	focusOnMount: boolean
	onKeyDown: (e: React.KeyboardEvent) => void
}

type State = {
	showCard: boolean
}

class TableRow extends React.Component<Props, State> {
	private titleRef = React.createRef<Editable>()
	state = {
		showCard: false
	}

	componentDidMount() {
		if (this.props.focusOnMount) {
			this.titleRef.current.focus()
		}
	}

	render() {
		const { boardTree, card, onKeyDown } = this.props
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

				<div ref={openButonRef} className="octo-hoverbutton" style={{ display: "none" }} onClick={() => { this.setState({showCard: true}) }}>Open</div>
				{this.state.showCard &&
					<RootPortal>
						<CardDialog boardTree={boardTree} card={card} onClose={() => this.setState({showCard: false})}/>
					</RootPortal>}
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
