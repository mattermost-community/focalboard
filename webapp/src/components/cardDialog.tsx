// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {Card} from '../blocks/card'
import {BoardTree} from '../viewModel/boardTree'
import mutator from '../mutator'
import Menu from '../widgets/menu'

import CardDetail from './cardDetail'
import Dialog from './dialog'

type Props = {
    boardTree: BoardTree
    card: Card
    onClose: () => void
}

class CardDialog extends React.Component<Props> {
    render() {
        const menu = (
            <Menu position='left'>
                <Menu.Text
                    id='delete'
                    name='Delete'
                    onClick={async () => {
                        await mutator.deleteBlock(this.props.card, 'delete card')
                        this.props.onClose()
                    }}
                />
            </Menu>
        )
        return (
            <Dialog
                onClose={this.props.onClose}
                toolsMenu={menu}
            >
                <CardDetail
                    boardTree={this.props.boardTree}
                    cardId={this.props.card.id}
                />
            </Dialog>
        )
    }
}

export {CardDialog}
