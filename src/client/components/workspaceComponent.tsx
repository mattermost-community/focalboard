import React from "react"
import { BoardTree } from "../boardTree"
import { Card } from "../card"
import { Mutator } from "../mutator"
import { Utils } from "../utils"
import { WorkspaceTree } from "../workspaceTree"
import { BoardComponent } from "./boardComponent"
import { Sidebar } from "./sidebar"
import { TableComponent } from "./tableComponent"

type Props = {
	mutator: Mutator,
	workspaceTree: WorkspaceTree
	boardTree?: BoardTree
	showBoard: (id: string) => void
	showView: (id: string) => void
	showFilter: (el: HTMLElement) => void
	setSearchText: (text: string) => void
}

class WorkspaceComponent extends React.Component<Props> {
	render() {
		const { mutator, boardTree, workspaceTree, showBoard } = this.props

		Utils.assert(workspaceTree)
		const element =
			<div className="octo-workspace">
				<Sidebar mutator={mutator} showBoard={showBoard} workspaceTree={workspaceTree} boardTree={boardTree}></Sidebar>
				{this.mainComponent()}
			</div>

		return element
	}

	private mainComponent() {
		const { mutator, boardTree, showFilter, setSearchText, showView } = this.props
		const { activeView } = boardTree || {}

		if (!activeView) {
			return <div></div>
		}

		switch (activeView?.viewType) {
			case "board": {
				return <BoardComponent mutator={mutator} boardTree={boardTree} showFilter={showFilter} setSearchText={setSearchText} showView={showView} />
			}

			case "table": {
				return <TableComponent mutator={mutator} boardTree={boardTree} showFilter={showFilter} setSearchText={setSearchText} showView={showView} />
			}

			default: {
				Utils.assertFailure(`render() Unhandled viewType: ${activeView.viewType}`)
				return <div></div>
			}
		}

	}
}

export { WorkspaceComponent }
