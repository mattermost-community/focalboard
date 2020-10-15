import React from "react"
import { Board } from "../board"
import { BoardTree } from "../boardTree"
import { BoardView } from "../boardView"
import mutator from "../mutator"
import { Utils } from "../utils"
import Menu from "../widgets/menu"

type Props = {
	boardTree?: BoardTree
	board: Board,
	showView: (id: string) => void
}

export default class ViewMenu extends React.Component<Props> {
	handleDeleteView = async (id: string) => {
		const { board, boardTree, showView } = this.props
		Utils.log(`deleteView`)
		const view = boardTree.activeView
		const nextView = boardTree.views.find(o => o !== view)
		await mutator.deleteBlock(view, "delete view")
		showView(nextView.id)
	}

	handleViewClick = (id: string) => {
		const { boardTree, showView } = this.props
		Utils.log(`view ` + id)
		const view = boardTree.views.find(o => o.id === id)
		showView(view.id)
	}

	handleAddViewBoard = async (id: string) => {
		const { board, boardTree, showView } = this.props
		Utils.log(`addview-board`)
		const view = new BoardView()
		view.title = "Board View"
		view.viewType = "board"
		view.parentId = board.id

		const oldViewId = boardTree.activeView.id

		await mutator.insertBlock(
			view,
			"add view",
			async () => { showView(view.id) },
			async () => { showView(oldViewId) })
	}

	handleAddViewTable = async (id: string) => {
		const { board, boardTree, showView } = this.props

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
			async () => { showView(view.id) },
			async () => { showView(oldViewId) })
	}

	render() {
		const { boardTree } = this.props
		return (
			<Menu>
				{boardTree.views.map((view) => (<Menu.Text key={view.id} id={view.id} name={view.title} onClick={this.handleViewClick} />))}
				<Menu.Separator />
				{boardTree.views.length > 1 && <Menu.Text id="__deleteView" name="Delete View" onClick={this.handleDeleteView} />}
				<Menu.SubMenu id="__addView" name="Add View">
					<Menu.Text id='board' name='Board' onClick={this.handleAddViewBoard} />
					<Menu.Text id='table' name='Table' onClick={this.handleAddViewTable} />
				</Menu.SubMenu>
			</Menu>
		)
	}
}
