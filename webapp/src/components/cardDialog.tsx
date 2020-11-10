// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {FormattedMessage} from 'react-intl'

import {Card} from '../blocks/card'
import {BoardTree} from '../viewModel/boardTree'
import mutator from '../mutator'
import Menu from '../widgets/menu'
import DeleteIcon from '../widgets/icons/delete'

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
                    icon={<DeleteIcon/>}
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
                {(this.props.card.isTemplate) &&
                    <div className='banner'>
                        <FormattedMessage
                            id='CardDialog.editing-template'
                            defaultMessage="You're editing a template"
                        />
                    </div>
                }
                <CardDetail
                    boardTree={this.props.boardTree}
                    cardId={this.props.card.id}
                />
            </Dialog>
        )
    }
}

export {CardDialog}
