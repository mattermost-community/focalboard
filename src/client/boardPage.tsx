import React from "react"
import ReactDOM from "react-dom"
import { BoardTree } from "./boardTree"
import { BoardView } from "./boardView"
import { CardTree } from "./cardTree"
import { BoardComponent } from "./components/boardComponent"
import { CardDialog } from "./components/cardDialog"
import { FilterComponent } from "./components/filterComponent"
import { TableComponent } from "./components/tableComponent"
import { FlashMessage } from "./flashMessage"
import { Mutator } from "./mutator"
import { OctoClient } from "./octoClient"
import { OctoListener } from "./octoListener"
import { IBlock, IPageController } from "./octoTypes"
import { UndoManager } from "./undomanager"
import { Utils } from "./utils"

class BoardPage implements IPageController {
	boardTitle: HTMLElement
	mainBoardHeader: HTMLElement
	mainBoardBody: HTMLElement
	groupByButton: HTMLElement
	groupByLabel: HTMLElement

	boardId: string
	viewId: string

	boardTree: BoardTree
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
		if (!queryString.has("id")) {
			// No id, redirect to home
			window.location.href = "/"
			return
		}

		this.boardId = queryString.get("id")
		this.viewId = queryString.get("v")

		console.log(`BoardPage. boardId: ${this.boardId}`)
		if (this.boardId) {
			this.boardTree = new BoardTree(this.octo, this.boardId)
			this.sync()

			this.boardListener.open(this.boardId, (blockId: string) => {
				console.log(`octoListener.onChanged: ${blockId}`)
				this.sync()
			})
		} else {
			// Show error
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

	render() {
		const { octo, boardTree } = this
		const { board, activeView } = boardTree
		const mutator = new Mutator(octo)

		const rootElement = Utils.getElementById("main")

		if (board) {
			Utils.setFavicon(board.icon)
		} else {
			ReactDOM.render(
				<div>Loading...</div>,
				rootElement
			)
			return
		}

		if (activeView) {
			document.title = `OCTO - ${board.title} | ${activeView.title}`

			switch (activeView.viewType) {
				case "board": {
					ReactDOM.render(
						<BoardComponent mutator={mutator} boardTree={this.boardTree} pageController={this} />,
						rootElement
					)
					break
				}

				case "table": {
					ReactDOM.render(
						<TableComponent mutator={mutator} boardTree={this.boardTree} pageController={this} />,
						rootElement
					)
					break
				}

				default: {
					Utils.assertFailure(`render() Unhandled viewType: ${activeView.viewType}`)
				}
			}

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
		} else {
			ReactDOM.render(
				<div>Loading...</div>,
				rootElement
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
					onClose={() => {this.showFilter(undefined)}}
				>
				</FilterComponent>,
				Utils.getElementById("modal")
			)
		} else {
			ReactDOM.render(<div />, Utils.getElementById("modal"))
		}
	}

	async sync() {
		const { boardTree } = this

		await boardTree.sync()

		// Default to first view
		if (!this.viewId) {
			this.viewId = boardTree.views[0].id
		}

		boardTree.setActiveView(this.viewId)
		// TODO: Handle error (viewId not found)
		this.viewId = boardTree.activeView.id

		console.log(`sync complete... title: ${boardTree.board.title}`)

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
