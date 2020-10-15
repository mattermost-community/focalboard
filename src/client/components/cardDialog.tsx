import React from "react"
import { BoardTree } from "../boardTree"
import { Card } from "../card"
import Menu from "../widgets/menu"
import Dialog from "./dialog"
import CardDetail from "./cardDetail"
import mutator from "../mutator"

type Props = {
	boardTree: BoardTree
	card: Card
	onClose: () => void
}

class CardDialog extends React.Component<Props> {
	render() {
        const menu = (
            <Menu>
                <Menu.Text id="delete" name="Delete" onClick={async () => {
                    await mutator.deleteBlock(this.props.card, "delete card")
                    this.props.onClose()
                }}/>
            </Menu>
        )
        return (
            <Dialog onClose={this.props.onClose} toolsMenu={menu}>
                <CardDetail boardTree={this.props.boardTree} card={this.props.card} />
            </Dialog>
        )
	}
}

export { CardDialog }
