import React from "react"
import { Archiver } from "../archiver"
import { Board } from "../board"
import { BoardTree } from "../boardTree"
import { Menu, MenuOption } from "../menu"
import mutator from "../mutator"
import { IPageController } from "../octoTypes"
import { WorkspaceTree } from "../workspaceTree"

type Props = {
	showBoard: (id: string) => void
	workspaceTree: WorkspaceTree,
	boardTree?: BoardTree
}

class Sidebar extends React.Component<Props> {

	render() {
		const { workspaceTree } = this.props
		if (!workspaceTree) {
			return <div></div>
		}

		const { boards } = workspaceTree

		return (
			<div className="octo-sidebar">
				{
					boards.map(board => {
						const displayTitle = board.title || "(Untitled Board)"
						return (
							<div key={board.id} className="octo-sidebar-item octo-hover-container">
								<div className="octo-sidebar-title" onClick={() => { this.boardClicked(board) }}>{board.icon ? `${board.icon} ${displayTitle}` : displayTitle}</div>
								<div className="octo-spacer"></div>
								<div className="octo-button square octo-hover-item" onClick={(e) => { this.showOptions(e, board) }}><div className="imageOptions" /></div>
							</div>
						)
					})
				}

				<br />

				<div className="octo-button" onClick={() => { this.addBoardClicked() }}>+ Add Board</div>

				<div className="octo-spacer"></div>

				<div className="octo-button" onClick={(e) => { this.settingsClicked(e) }}>Settings</div>
			</div>
		)
	}

	private showOptions(e: React.MouseEvent, board: Board) {
		const { showBoard, workspaceTree } = this.props
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
						async () => { showBoard(nextBoardId!) },
						async () => { showBoard(board.id) },
					)
					break
				}
			}
		}
		Menu.shared.showAtElement(e.target as HTMLElement)
	}

	private settingsClicked(e: React.MouseEvent) {
		Menu.shared.options = [
			{ id: "import", name: "Import Archive" },
			{ id: "export", name: "Export Archive" },
		]
		Menu.shared.onMenuClicked = (optionId: string, type?: string) => {
			switch (optionId) {
				case "import": {
					Archiver.importFullArchive(() => {
						this.forceUpdate()
					})
					break
				}
				case "export": {
					Archiver.exportFullArchive()
					break
				}
			}
		}

		// HACKHACK: Show menu above (TODO: refactor menu code to do this automatically)
		const element = e.target as HTMLElement
		const bodyRect = document.body.getBoundingClientRect()
		const rect = element.getBoundingClientRect()
		Menu.shared.showAt(rect.left - bodyRect.left + 20, rect.top - bodyRect.top - 30 * Menu.shared.options.length)
	}

	private boardClicked(board: Board) {
		this.props.showBoard(board.id)
	}

	async addBoardClicked() {
		const { boardTree, showBoard } = this.props

		const oldBoardId = boardTree?.board?.id
		const board = new Board()
		await mutator.insertBlock(
			board,
			"add board",
			async () => { showBoard(board.id) },
			async () => { if (oldBoardId) { showBoard(oldBoardId) } })

		await mutator.insertBlock(board)
	}
}

export { Sidebar }
