import React from "react"
import { Board } from "../board"
import { WorkspaceTree } from "../workspaceTree"

type Props = {
	workspaceTree: WorkspaceTree
}

class Sidebar extends React.Component<Props> {

	render() {
		const { workspaceTree } = this.props
		const { boards } = workspaceTree

		return (
			<div className="octo-sidebar">
				{ boards.map(board => {
					const displayTitle = board.title || "(Untitled Board)"
					return (
						<div className="octo-sidebar-item" onClick={() => { this.boardClicked(board) }}>
							{board.icon ? `${board.icon} ${displayTitle}` : displayTitle}
						</div>
					)
				})}
			</div>
		)
	}

	private boardClicked(board: Board) {
		// TODO
	}
}

export { Sidebar }
