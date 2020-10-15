import React from "react"
import { BoardTree } from "../boardTree"
import { Card } from "../card"
import { Utils } from "../utils"
import { WorkspaceTree } from "../workspaceTree"
import { BoardComponent } from "./boardComponent"
import { Sidebar } from "./sidebar"
import { TableComponent } from "./tableComponent"

type Props = {
	workspaceTree: WorkspaceTree
	boardTree?: BoardTree
	showBoard: (id: string) => void
	showView: (id: string) => void
	showCard: (card: Card) => void
	showFilter: (el: HTMLElement) => void
	setSearchText: (text: string) => void
}

class WorkspaceComponent extends React.Component<Props> {
	render() {
		const { boardTree, workspaceTree, showBoard } = this.props

		Utils.assert(workspaceTree)
		const element =
			<div className="octo-workspace">
				<Sidebar showBoard={showBoard} workspaceTree={workspaceTree} boardTree={boardTree}></Sidebar>
				{this.mainComponent()}
			</div>

		return element
	}

	private mainComponent() {
		const { boardTree, showCard, showFilter, setSearchText, showView } = this.props
		const { activeView } = boardTree || {}

		if (!activeView) {
			return <div></div>
		}

		switch (activeView?.viewType) {
			case "board": {
				return <BoardComponent boardTree={boardTree} showCard={showCard} showFilter={showFilter} setSearchText={setSearchText} showView={showView} />
			}

			case "table": {
				return <TableComponent boardTree={boardTree} showCard={showCard} showFilter={showFilter} setSearchText={setSearchText} showView={showView} />
			}

			default: {
				Utils.assertFailure(`render() Unhandled viewType: ${activeView.viewType}`)
				return <div></div>
			}
		}

	}
}

export { WorkspaceComponent }
