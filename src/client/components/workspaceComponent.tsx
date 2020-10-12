import React from "react"
import { BoardTree } from "../boardTree"
import { Mutator } from "../mutator"
import { IPageController } from "../octoTypes"
import { Utils } from "../utils"
import { WorkspaceTree } from "../workspaceTree"
import { BoardComponent } from "./boardComponent"
import { Sidebar } from "./sidebar"
import { TableComponent } from "./tableComponent"

type Props = {
	mutator: Mutator,
	workspaceTree: WorkspaceTree
	boardTree?: BoardTree
	pageController: IPageController
}

class WorkspaceComponent extends React.Component<Props> {
	render() {
		const { mutator, workspaceTree } = this.props

		const element =
			<div className="octo-workspace">
				<Sidebar mutator={mutator} workspaceTree={workspaceTree}></Sidebar>
				{this.mainComponent()}
			</div>

		return element
	}

	private mainComponent() {
		const { mutator, boardTree, pageController } = this.props
		const { activeView } = boardTree

		switch (activeView.viewType) {
			case "board": {
				return <BoardComponent mutator={mutator} boardTree={boardTree} pageController={pageController} />
			}

			case "table": {
				return <TableComponent mutator={mutator} boardTree={boardTree} pageController={pageController} />
			}

			default: {
				Utils.assertFailure(`render() Unhandled viewType: ${activeView.viewType}`)
				return <div></div>
			}
		}

	}
}

export { WorkspaceComponent }
