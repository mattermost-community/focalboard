import React from 'react'
import { Archiver } from "../archiver"
import { Board } from "../board"
import Button from '../components/button'
import { Mutator } from "../mutator"
import { OctoClient } from "../octoClient"
import { IBlock } from "../octoTypes"
import { UndoManager } from "../undomanager"
import { Utils } from "../utils"

type Props = {}

type State = {
	boards: IBlock[]
}

export default class HomePage extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props)
		this.state = {
			boards: [],
		}
	}

	componentDidMount() {
		this.loadBoards()
	}

	loadBoards = async () => {
		const octo = new OctoClient()
		const boards = await octo.getBlocks(null, "board")
		this.setState({ boards })
	}

	importClicked = async () => {
		const octo = new OctoClient()
		const mutator = new Mutator(octo, UndoManager.shared)
		Archiver.importFullArchive(mutator, () => {
			this.loadBoards()
		})
	}

	exportClicked = async () => {
		const octo = new OctoClient()
		const mutator = new Mutator(octo, UndoManager.shared)
		Archiver.exportFullArchive(mutator)
	}

	addClicked = async () => {
		const octo = new OctoClient()
		const board = new Board()
		await octo.insertBlock(board)
	}

	render(): React.ReactNode {
		return (
			<div>
				<Button onClick={this.addClicked}>+ Add Board</Button>
				<br />
				<Button onClick={this.addClicked}>Import Archive</Button>
				<br />
				<Button onClick={this.addClicked}>Export Archive</Button>
				{this.state.boards.map((board) => (
					<p>
						<a href={`/board/${board.id}`}>
							<span>{board.title}</span>
							<span>{Utils.displayDate(new Date(board.updateAt))}</span>
						</a>
					</p>
				))}
			</div>
		)
	}
}
