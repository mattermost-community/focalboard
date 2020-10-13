import React from "react"
import ReactDOM from "react-dom"
import { BoardTree } from "./boardTree"
import { BoardView } from "./boardView"
import { CardTree } from "./cardTree"
import { CardDialog } from "./components/cardDialog"
import { FilterComponent } from "./components/filterComponent"
import { PageHeader } from "./components/pageHeader"
import { WorkspaceComponent } from "./components/workspaceComponent"
import { FlashMessage } from "./flashMessage"
import { Mutator } from "./mutator"
import { OctoClient } from "./octoClient"
import { OctoListener } from "./octoListener"
import { IBlock, IPageController } from "./octoTypes"
import { UndoManager } from "./undomanager"
import { Utils } from "./utils"
import { WorkspaceTree } from "./workspaceTree"

class BoardPage implements IPageController {
	boardTitle: HTMLElement
	mainBoardHeader: HTMLElement
	mainBoardBody: HTMLElement
	groupByButton: HTMLElement
	groupByLabel: HTMLElement

	boardId?: string
	viewId?: string

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

	constructor() {
		const queryString = new URLSearchParams(window.location.search)
		const boardId = queryString.get("id")
		const viewId = queryString.get("v")

		this.layoutPage()

		this.workspaceTree = new WorkspaceTree(this.octo)

		console.log(`BoardPage. boardId: ${this.boardId}`)
		if (boardId) {
			this.attachToBoard(boardId, viewId)
		} else {
			this.sync()
		}

		document.body.addEventListener("keydown", async (e) => {
			if (e.target !== document.body) { return }

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
		})

		this.render()
	}

	private layoutPage() {
		const root = Utils.getElementById("octo-tasks-app")
		root.innerText = ""

		const header = root.appendChild(document.createElement("div"))
		header.id = "header"

		const main = root.appendChild(document.createElement("div"))
		main.id = "main"

		const overlay = root.appendChild(document.createElement("div"))
		overlay.id = "overlay"

		const modal = root.appendChild(document.createElement("div"))
		modal.id = "modal"
	}

	render() {
		const { octo, boardTree } = this
		const { board, activeView } = boardTree || {}
		const mutator = new Mutator(octo)

		const mainElement = Utils.getElementById("main")

		ReactDOM.render(
			<PageHeader />,
			Utils.getElementById("header")
		)

		ReactDOM.render(
			<PageHeader />,
			Utils.getElementById("header")
		)

		if (board) {
			Utils.setFavicon(board.icon)
			document.title = `OCTO - ${board.title} | ${activeView.title}`
		}

		ReactDOM.render(
			<WorkspaceComponent mutator={mutator} workspaceTree={this.workspaceTree} boardTree={this.boardTree} pageController={this} />,
			mainElement
		)

		if (boardTree && boardTree.board && this.shownCardTree) {
			ReactDOM.render(
				<CardDialog mutator={mutator} boardTree={boardTree} cardTree={this.shownCardTree} onClose={() => { this.showCard(undefined) }}></CardDialog>,
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
					boardTree={boardTree}
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
	}

	private attachToBoard(boardId: string, viewId?: string) {
		this.boardId = boardId
		this.viewId = viewId

		this.boardTree = new BoardTree(this.octo, boardId)

		this.boardListener.open(boardId, (blockId: string) => {
			console.log(`octoListener.onChanged: ${blockId}`)
			this.sync()
		})

		this.sync()
	}

	async sync() {
		const { workspaceTree, boardTree } = this

		await workspaceTree.sync()
		if (boardTree) {
			await boardTree.sync()

			// Default to first view
			if (!this.viewId) {
				this.viewId = boardTree.views[0].id
			}

			boardTree.setActiveView(this.viewId)
			// TODO: Handle error (viewId not found)
			this.viewId = boardTree.activeView.id
			console.log(`sync complete... title: ${boardTree.board.title}`)
		}

		this.render()
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

		this.render()
	}

	showBoard(boardId: string) {
		if (this.boardTree?.board?.id === boardId) { return }

		const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + `?id=${encodeURIComponent(boardId)}`
		window.history.pushState({ path: newUrl }, "", newUrl)

		this.attachToBoard(boardId)
	}

	showView(viewId: string) {
		this.viewId = viewId
		this.boardTree.setActiveView(this.viewId)
		const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + `?id=${encodeURIComponent(this.boardId)}&v=${encodeURIComponent(viewId)}`
		window.history.pushState({ path: newUrl }, "", newUrl)
		this.render()
	}

	showFilter(ahchorElement?: HTMLElement) {
		this.filterAnchorElement = ahchorElement
		this.render()
	}

	setSearchText(text?: string) {
		this.boardTree.setSearchText(text)
		this.render()
	}
}

export { BoardPage }

const _ = new BoardPage()
console.log("BoardPage")
