import React from "react"
import ReactDOM from "react-dom"
import { BoardTree } from "../boardTree"
import { BoardView } from "../boardView"
import { CardTree } from "../cardTree"
import { CardDialog } from "../components/cardDialog"
import { FilterComponent } from "../components/filterComponent"
import { PageHeader } from "../components/pageHeader"
import { WorkspaceComponent } from "../components/workspaceComponent"
import { FlashMessage } from "../flashMessage"
import { Mutator } from "../mutator"
import { OctoClient } from "../octoClient"
import { OctoListener } from "../octoListener"
import { IBlock, IPageController } from "../octoTypes"
import { UndoManager } from "../undomanager"
import { Utils } from "../utils"
import { WorkspaceTree } from "../workspaceTree"

type Props = {
}

type State = {
    boardId: string
    viewId: string
    workspaceTree: WorkspaceTree
    boardTree?: BoardTree
}

export default class BoardPage extends React.Component<Props, State> {
	workspaceTree: WorkspaceTree
	boardTree?: BoardTree
	view: BoardView

	updateTitleTimeout: number
	updatePropertyLabelTimeout: number

	shownCardTree: CardTree

	private filterAnchorElement?: HTMLElement
	private octo = new OctoClient()
	private boardListener = new OctoListener()
	private cardListener = new OctoListener()

	constructor(props: Props) {
        super(props)
		const queryString = new URLSearchParams(window.location.search)
		const boardId = queryString.get("id")
		const viewId = queryString.get("v")

        this.state = {
            boardId,
            viewId,
		    workspaceTree: new WorkspaceTree(this.octo),
        }

		console.log(`BoardPage. boardId: ${boardId}`)
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        const board = this.state.boardTree.board;
        const prevBoard = prevState.boardTree.board;

        const activeView = this.state.boardTree.activeView;
        const prevActiveView = prevState.boardTree.activeView;

		if (board.icon !== prevBoard.icon) {
			Utils.setFavicon(board.icon)
        }
		if (board.title !== prevBoard.title || activeView.title !== prevActiveView.title) {
			document.title = `OCTO - ${board.title} | ${activeView.title}`
		}
    }

    undoRedoHandler = async (e: KeyboardEvent) => {
        if (e.target !== document) { return }

        if (e.keyCode === 90 && !e.shiftKey && (e.ctrlKey || e.metaKey) && !e.altKey) {		// Cmd+Z
            Utils.log(`Undo`)
            const description = UndoManager.shared.undoDescription
            await UndoManager.shared.undo()
            if (description) {
                FlashMessage.show(`Undo ${description}`)
            } else {
                FlashMessage.show(`Undo`)
            }
        } else if (e.keyCode === 90 && e.shiftKey && (e.ctrlKey || e.metaKey) && !e.altKey) {		// Shift+Cmd+Z
            Utils.log(`Redo`)
            const description = UndoManager.shared.redoDescription
            await UndoManager.shared.redo()
            if (description) {
                FlashMessage.show(`Redo ${description}`)
            } else {
                FlashMessage.show(`Redo`)
            }
        }
    }

    componentDidMount() {
		document.addEventListener("keydown", this.undoRedoHandler)
		if (this.state.boardId) {
			this.attachToBoard(this.state.boardId, this.state.viewId)
        } else {
            this.sync()
        }
	}

    componentWillUnmount() {
		document.removeEventListener("keydown", this.undoRedoHandler)
    }

	render() {
		const { board, activeView } = this.state.boardTree || {}
		const mutator = new Mutator(this.octo)

        // TODO Move all this into the root portal component when that is merged
		if (this.state.boardTree && this.state.boardTree.board && this.shownCardTree) {
			ReactDOM.render(
				<CardDialog mutator={mutator} boardTree={this.state.boardTree} cardTree={this.shownCardTree} onClose={() => { this.showCard(undefined) }}></CardDialog>,
				Utils.getElementById("overlay")
			)
		} else {
			ReactDOM.render(
				<div />,
				Utils.getElementById("overlay")
			)
		}

		if (this.filterAnchorElement) {
			const element = this.filterAnchorElement
			const bodyRect = document.body.getBoundingClientRect()
			const rect = element.getBoundingClientRect()
			// Show at bottom-left of element
			const maxX = bodyRect.right - 420 - 100
			const pageX = Math.min(maxX, rect.left - bodyRect.left)
			const pageY = rect.bottom - bodyRect.top

			ReactDOM.render(
				<FilterComponent
					mutator={mutator}
					boardTree={this.state.boardTree}
					pageX={pageX}
					pageY={pageY}
					onClose={() => { this.showFilter(undefined) }}
				>
				</FilterComponent>,
				Utils.getElementById("modal")
			)
		} else {
			ReactDOM.render(<div />, Utils.getElementById("modal"))
		}

        return (
            <div className='BoardPage'>
                <WorkspaceComponent mutator={mutator} workspaceTree={this.workspaceTree} boardTree={this.state.boardTree} showView={this.showView} showCard={this.showCard} showBoard={this.showBoard} showFilter={this.showFilter} setSearchText={this.setSearchText} />,
            </div>
        );
	}

	private attachToBoard(boardId: string, viewId?: string) {
		const boardTree = new BoardTree(this.octo, boardId)
        this.setState({
            boardId,
            viewId,
            boardTree,
        })

		this.boardListener.open(boardId, (blockId: string) => {
			console.log(`octoListener.onChanged: ${blockId}`)
			this.sync()
		})

		this.sync()
	}

	async sync() {
		const { viewId, workspaceTree, boardTree } = this.state

		await workspaceTree.sync()
		if (boardTree) {
			await boardTree.sync()

			// Default to first view
			if (!viewId) {
                this.setState({viewId: boardTree.views[0].id})
			}

			boardTree.setActiveView(this.state.viewId)
			// TODO: Handle error (viewId not found)
            this.setState({
                viewId: boardTree.activeView.id
            })
			console.log(`sync complete... title: ${boardTree.board.title}`)
		}
	}

	// IPageController

	async showCard(card: IBlock) {
		this.cardListener.close()

		if (card) {
			const cardTree = new CardTree(this.octo, card.id)
			await cardTree.sync()
			this.shownCardTree = cardTree

			this.cardListener = new OctoListener()
			this.cardListener.open(card.id, async () => {
				await cardTree.sync()
				this.render()
			})
		} else {
			this.shownCardTree = undefined
		}
	}

	showBoard(boardId: string) {
		if (this.boardTree?.board?.id === boardId) { return }

		const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + `?id=${encodeURIComponent(boardId)}`
		window.history.pushState({ path: newUrl }, "", newUrl)

		this.attachToBoard(boardId)
	}

	showView(viewId: string) {
		this.state.boardTree.setActiveView(viewId)
        this.setState({viewId, boardTree: this.state.boardTree})
		const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + `?id=${encodeURIComponent(this.state.boardId)}&v=${encodeURIComponent(viewId)}`
		window.history.pushState({ path: newUrl }, "", newUrl)
	}

	showFilter(ahchorElement?: HTMLElement) {
		this.filterAnchorElement = ahchorElement
	}

	setSearchText(text?: string) {
		this.boardTree.setSearchText(text)
	}
}
