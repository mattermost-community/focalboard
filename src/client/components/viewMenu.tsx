import React from "react"

import { Mutator } from "../mutator"
import Menu from "../widgets/menu"
import { Board } from "../board"
import { BoardTree } from "../boardTree"
import { IPageController } from "../octoTypes"
import { Utils } from "../utils"
import { BoardView } from "../boardView"

type Props = {
	mutator: Mutator,
	boardTree?: BoardTree
	pageController: IPageController,
    board: Board,
    onClose: () => void,
}
export default class ViewMenu extends React.Component<Props> {
    handleDeleteView = async (id: string) => {
        const {board, boardTree, mutator, pageController} = this.props;
        Utils.log(`deleteView`)
        const view = boardTree.activeView
        const nextView = boardTree.views.find(o => o !== view)
        await mutator.deleteBlock(view, "delete view")
        pageController.showView(nextView.id)
    }

    handleViewClick = (id: string) => {
        const {boardTree, pageController} = this.props;
        Utils.log(`view ` + id)
        const view = boardTree.views.find(o => o.id === id)
        pageController.showView(view.id)
    }

    handleAddViewBoard = async (id: string) => {
        const {board, boardTree, mutator, pageController} = this.props;
        Utils.log(`addview-board`)
        const view = new BoardView()
        view.title = "Board View"
        view.viewType = "board"
        view.parentId = board.id

        const oldViewId = boardTree.activeView.id

        await mutator.insertBlock(
            view,
            "add view",
            async () => { pageController.showView(view.id) },
            async () => { pageController.showView(oldViewId) })
    }

    handleAddViewTable = async (id: string) => {
        const {board, boardTree, mutator, pageController} = this.props;

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
            async () => { pageController.showView(view.id) },
            async () => { pageController.showView(oldViewId) })
    }

    render() {
        const {board, onClose, boardTree, mutator, pageController} = this.props;
        return (
            <Menu onClose={onClose}>
                {boardTree.views.map((view) => (<Menu.Text key={view.id} id={view.id} name={view.title} onClick={this.handleViewClick}/>))}
                <Menu.Separator/>
                {boardTree.views.length > 1 && <Menu.Text id="__deleteView" name="Delete View" onClick={this.handleDeleteView} />}
                <Menu.SubMenu id="__addView" name="Add View">
                    <Menu.Text id='board' name='Board' onClick={this.handleAddViewBoard}/>
                    <Menu.Text id='table' name='Table' onClick={this.handleAddViewTable}/>
                </Menu.SubMenu>
            </Menu>
        );
    }
}
