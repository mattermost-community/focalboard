import React from "react"

type Props = {
	onDrop?: (e: React.DragEvent<HTMLDivElement>) => void
}

type State = {
	isDragOver?: boolean
}

class BoardColumn extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props)
		this.state = {}
	}

	render() {
		const element =
			<div
				className={this.state.isDragOver ? "octo-board-column dragover" : "octo-board-column"}
				onDragOver={(e) => { e.preventDefault(); this.setState({ isDragOver: true }) }}
				onDragEnter={(e) => { e.preventDefault(); this.setState({ isDragOver: true }) }}
				onDragLeave={(e) => { e.preventDefault(); this.setState({ isDragOver: false }) }}
				onDrop={(e) => { this.setState({ isDragOver: false }); this.props.onDrop(e) }}
			>
				{this.props.children}
			</div>

		return element
	}
}

export { BoardColumn }
