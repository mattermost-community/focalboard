// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import mutator from '../mutator'
import {OctoListener} from '../octoListener'
import {Utils} from '../utils'
import {BoardTree} from '../viewModel/boardTree'
import {CardTree, MutableCardTree} from '../viewModel/cardTree'
import DeleteIcon from '../widgets/icons/delete'
import Menu from '../widgets/menu'

import CardDetail from './cardDetail'
import Dialog from './dialog'

type Props = {
    boardTree: BoardTree
    cardId: string
    onClose: () => void
    showCard: (cardId?: string) => void
    intl: IntlShape
}

type State = {
    cardTree?: CardTree
}

class CardDialog extends React.Component<Props, State> {
    state: State = {}

    private cardListener?: OctoListener

    shouldComponentUpdate(): boolean {
        return true
    }

    componentDidMount(): void {
        this.createCardTreeAndSync()
    }

    private async createCardTreeAndSync() {
        const cardTree = new MutableCardTree(this.props.cardId)
        await cardTree.sync()
        this.createListener()
        this.setState({cardTree})
        Utils.log(`cardDialog.createCardTreeAndSync: ${cardTree.card.id}`)
    }

    private createListener() {
        this.cardListener = new OctoListener()
        this.cardListener.open(
            [this.props.cardId],
            async (blocks) => {
                Utils.log(`cardListener.onChanged: ${blocks.length}`)
                const newCardTree = this.state.cardTree!.mutableCopy()
                if (newCardTree.incrementalUpdate(blocks)) {
                    this.setState({cardTree: newCardTree})
                }
            },
            async () => {
                Utils.log('cardListener.onReconnect')
                const newCardTree = this.state.cardTree!.mutableCopy()
                await newCardTree.sync()
                this.setState({cardTree: newCardTree})
            },
        )
    }

    componentWillUnmount(): void {
        this.cardListener?.close()
        this.cardListener = undefined
    }

    render(): JSX.Element {
        const {cardTree} = this.state

        const menu = (
            <Menu position='left'>
                <Menu.Text
                    id='delete'
                    icon={<DeleteIcon/>}
                    name='Delete'
                    onClick={async () => {
                        const card = this.state.cardTree?.card
                        if (!card) {
                            Utils.assertFailure()
                            return
                        }
                        await mutator.deleteBlock(card, 'delete card')
                        this.props.onClose()
                    }}
                />
                {(cardTree && !cardTree.card.isTemplate) &&
                    <Menu.Text
                        id='makeTemplate'
                        name='New template from card'
                        onClick={this.makeTemplateClicked}
                    />
                }
            </Menu>
        )
        return (
            <Dialog
                onClose={this.props.onClose}
                toolsMenu={menu}
            >
                {(cardTree?.card.isTemplate) &&
                    <div className='banner'>
                        <FormattedMessage
                            id='CardDialog.editing-template'
                            defaultMessage="You're editing a template"
                        />
                    </div>
                }
                {this.state.cardTree &&
                    <CardDetail
                        boardTree={this.props.boardTree}
                        cardTree={this.state.cardTree}
                    />
                }
            </Dialog>
        )
    }

    private makeTemplateClicked = async () => {
        const {cardTree} = this.state
        if (!cardTree) {
            Utils.assertFailure('this.state.cardTree')
            return
        }

        await mutator.duplicateCard(
            cardTree.card.id,
            this.props.intl.formatMessage({id: 'Mutator.new-template-from-card', defaultMessage: 'new template from card'}),
            true,
            async (newCardId) => {
                this.props.showCard(newCardId)
            },
            async () => {
                this.props.showCard(undefined)
            },
        )
    }
}

export default injectIntl(CardDialog)
