import React from "react"
import { Board } from "../board"
import { BoardTree } from "../boardTree"
import { Mutator } from "../mutator"
import { IPageController } from "../octoTypes"
import { WorkspaceTree } from "../workspaceTree"

type Props = {
	mutator: Mutator
	pageController: IPageController
	workspaceTree: WorkspaceTree,
	boardTree?: BoardTree
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
		const { pageController } = this.props
		pageController.showBoard(board.id)
	}

	async addBoardClicked() {
		const { mutator, boardTree, pageController } = this.props

		const oldBoardId = boardTree?.board?.id
		const board = new Board()
		await mutator.insertBlock(
			board,
			"add board",
			async () => { pageController.showBoard(board.id) },
			async () => { if (oldBoardId) { pageController.showBoard(oldBoardId) } })

		await mutator.insertBlock(board)
	}
}

export { Sidebar }
