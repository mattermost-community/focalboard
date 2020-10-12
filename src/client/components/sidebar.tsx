import React from "react"
import { Board } from "../board"
import { Mutator } from "../mutator"
import { WorkspaceTree } from "../workspaceTree"

type Props = {
	mutator: Mutator
	workspaceTree: WorkspaceTree
}

class Sidebar extends React.Component<Props> {

	render() {
		const { workspaceTree } = this.props
		const { boards } = workspaceTree

		return (
			<div className="octo-sidebar">
				{
					boards.map(board => {
						const displayTitle = board.title || "(Untitled Board)"
						return (
							<div key={board.id} className="octo-sidebar-item" onClick={() => { this.boardClicked(board) }}>
								{board.icon ? `${board.icon} ${displayTitle}` : displayTitle}
							</div>
						)
					})
				}

				<br />

				<div className="octo-button" onClick={() => { this.addBoardClicked() }}>+ Add Board</div>
			</div>
		)
	}

	private boardClicked(board: Board) {
		// TODO
	}

	async addBoardClicked() {
		const { mutator } = this.props

		const board = new Board()
		await mutator.insertBlock(board)
	}
}

export { Sidebar }
