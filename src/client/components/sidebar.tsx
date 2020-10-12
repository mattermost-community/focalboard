import React from "react"
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
					return (
						<div>
							{board.title || "(Untitled Board)"}
						</div>
					)
				})}
			</div>
		)
	}
}

export { Sidebar }
