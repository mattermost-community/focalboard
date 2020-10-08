import { Archiver } from "./archiver"
import { Board } from "./board"
import { Mutator } from "./mutator"
import { OctoClient } from "./octoClient"
import { UndoManager } from "./undomanager"
import { Utils } from "./utils"

class BoardsPage {
	boardsPanel: HTMLElement

	boardId: string
	boards: Board[]

	octo = new OctoClient()

	constructor() {
		// This is a placeholder page

		const mainPanel = Utils.getElementById("main")

		this.boardsPanel = mainPanel.appendChild(document.createElement("div"))

		{
			const addButton = document.body.appendChild(document.createElement("div"))
			addButton.className = "octo-button"
			addButton.innerText = "+ Add Board"
			addButton.onclick = () => { this.addClicked() }
		}

		document.body.appendChild(document.createElement("br"))

		{
			const importButton = document.body.appendChild(document.createElement("div"))
			importButton.className = "octo-button"
			importButton.innerText = "Import archive"
			importButton.onclick = async () => {
				const octo = new OctoClient()
				const mutator = new Mutator(octo, UndoManager.shared)
				Archiver.importFullArchive(mutator, () => {
					this.updateView()
				})
			}
		}

		{
			const exportButton = document.body.appendChild(document.createElement("div"))
			exportButton.className = "octo-button"
			exportButton.innerText = "Export archive"
			exportButton.onclick = () => {
				const octo = new OctoClient()
				const mutator = new Mutator(octo, UndoManager.shared)
				Archiver.exportFullArchive(mutator)
			}
		}

		this.updateView()
	}

	async getBoardData() {
		const boards = this.octo.getBlocks(null, "board")
	}

	async updateView() {
		const { boardsPanel } = this

		boardsPanel.innerText = ""

		const boards = await this.octo.getBlocks(null, "board")
		for (const board of boards) {
			const p = boardsPanel.appendChild(document.createElement("p"))
			const a = p.appendChild(document.createElement("a"))
			a.style.padding = "5px 10px"
			a.style.fontSize = "20px"
			a.href = `./board?id=${encodeURIComponent(board.id)}`

			if (board.icon) {
				const icon = a.appendChild(document.createElement("span"))
				icon.className = "octo-icon"
				icon.style.marginRight = "10px"
				icon.innerText = board.icon
			}

			const title = a.appendChild(document.createElement("b"))
			const updatedDate = new Date(board.updateAt)
			title.innerText = board.title
			const details = a.appendChild(document.createElement("span"))
			details.style.fontSize = "15px"
			details.style.color = "#909090"
			details.style.marginLeft = "10px"
			details.innerText = ` ${Utils.displayDate(updatedDate)}`
		}

		console.log(`updateView: ${boards.length} board(s).`)
	}

	async addClicked() {
		const board = new Board()
		await this.octo.insertBlock(board)
		await this.updateView()
	}
}

export = BoardsPage

const _ = new BoardsPage()
console.log("boardsView")
