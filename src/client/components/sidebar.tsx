import React from "react"
import { Board } from "../board"
import { BoardTree } from "../boardTree"
import { Menu, MenuOption } from "../menu"
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
							<div key={board.id} className="octo-sidebar-item octo-hover-container" onClick={() => { this.boardClicked(board) }}>
								<div>{board.icon ? `${board.icon} ${displayTitle}` : displayTitle}</div>
								<div className="octo-spacer"></div>
								<div className="octo-button square octo-hover-item" onClick={(e) => { this.showOptions(e, board) }}><div className="imageOptions" /></div>
							</div>
						)
					})
				}

				<br />

				<div className="octo-button" onClick={() => { this.addBoardClicked() }}>+ Add Board</div>
			</div>
		)
	}

	private showOptions(e: React.MouseEvent, board: Board) {
		const { mutator, pageController, workspaceTree } = this.props
		const { boards } = workspaceTree

		const options: MenuOption[] = []

		const nextBoardId = boards.length > 1 ? boards.find(o => o.id !== board.id).id : undefined
		if (nextBoardId) {
			options.push({ id: "delete", name: "Delete board" })
		}

		Menu.shared.options = options
		Menu.shared.onMenuClicked = (optionId: string, type?: string) => {
			switch (optionId) {
				case "delete": {
					mutator.deleteBlock(
						board,
						"delete block",
						async () => { pageController.showBoard(nextBoardId!) },
						async () => { pageController.showBoard(board.id) },
					)
					break
				}
			}
		}
		Menu.shared.showAtElement(e.target as HTMLElement)
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
