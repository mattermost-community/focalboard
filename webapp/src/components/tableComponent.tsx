// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {BlockIcons} from '../blockIcons'
import {MutableCard} from '../blocks/card'
import {Constants} from '../constants'
import mutator from '../mutator'
import {Utils} from '../utils'
import {BoardTree} from '../viewModel/boardTree'

import CardDialog from './cardDialog'
import RootPortal from './rootPortal'
import './tableComponent.scss'
import TopBar from './topBar'
import ViewHeader from './viewHeader'
import ViewTitle from './viewTitle'
import Table from './table/table'

type Props = {
    boardTree: BoardTree
    showView: (id: string) => void
    setSearchText: (text?: string) => void
    intl: IntlShape
    readonly: boolean
}

type State = {
    shownCardId?: string
    cardIdToFocusOnRender: string
}

class TableComponent extends React.Component<Props, State> {
    state: State = {cardIdToFocusOnRender: ''}

    shouldComponentUpdate(): boolean {
        return true
    }

    componentDidMount(): void {
        this.showCardInUrl()
    }

    private showCardInUrl() {
        const queryString = new URLSearchParams(window.location.search)
        const cardId = queryString.get('c') || undefined
        if (cardId !== this.state.shownCardId) {
            this.setState({shownCardId: cardId})
        }
    }

    render(): JSX.Element {
        const {boardTree, showView} = this.props
        const {board} = boardTree

        return (
            <div className='TableComponent octo-app'>
                {this.state.shownCardId &&
                <RootPortal>
                    <CardDialog
                        key={this.state.shownCardId}
                        boardTree={boardTree}
                        cardId={this.state.shownCardId}
                        onClose={() => this.showCard(undefined)}
                        showCard={(cardId) => this.showCard(cardId)}
                        readonly={this.props.readonly}
                    />
                </RootPortal>}
                <div className='octo-frame'>
                    <TopBar/>
                    <ViewTitle
                        key={board.id + board.title}
                        board={board}
                        readonly={this.props.readonly}
                    />

                    <div className='octo-table'>
                        <ViewHeader
                            boardTree={boardTree}
                            showView={showView}
                            setSearchText={this.props.setSearchText}
                            addCard={this.addCardAndShow}
                            addCardFromTemplate={this.addCardFromTemplate}
                            addCardTemplate={this.addCardTemplate}
                            editCardTemplate={this.editCardTemplate}
                            readonly={this.props.readonly}
                        />

                        {/* Main content */}
                        <Table
                            boardTree={boardTree}
                            readonly={this.props.readonly}
                            cardIdToFocusOnRender={this.state.cardIdToFocusOnRender}
                            showCard={this.showCard}
                            addCard={this.addCard}
                        />
                    </div>
                </div >
            </div >
        )
    }

    private showCard = (cardId?: string) => {
        Utils.replaceUrlQueryParam('c', cardId)
        this.setState({shownCardId: cardId})
    }

    private columnWidth(templateId: string): number {
        return Math.max(Constants.minColumnWidth, this.props.boardTree.activeView.columnWidths[templateId] || 0)
    }

    private addCardAndShow = () => {
        this.addCard(true)
    }

    private addCardFromTemplate = async (cardTemplateId: string) => {
        await mutator.duplicateCard(
            cardTemplateId,
            this.props.intl.formatMessage({id: 'Mutator.new-card-from-template', defaultMessage: 'new card from template'}),
            false,
            async (newCardId) => {
                this.showCard(newCardId)
            },
            async () => {
                this.showCard(undefined)
            },
        )
    }

    private addCard = async (show = false) => {
        const {boardTree} = this.props

        const card = new MutableCard()

        card.parentId = boardTree.board.id
        card.rootId = boardTree.board.rootId
        if (!card.icon) {
            card.icon = BlockIcons.shared.randomIcon()
        }
        await mutator.insertBlock(
            card,
            'add card',
            async () => {
                if (show) {
                    this.showCard(card.id)
                } else {
                    // Focus on this card's title inline on next render
                    this.setState({cardIdToFocusOnRender: card.id})
                    setTimeout(() => this.setState({cardIdToFocusOnRender: ''}), 100)
                }
            },
        )
    }

    private addCardTemplate = async () => {
        const {boardTree} = this.props

        const cardTemplate = new MutableCard()
        cardTemplate.isTemplate = true
        cardTemplate.parentId = boardTree.board.id
        cardTemplate.rootId = boardTree.board.rootId
        await mutator.insertBlock(
            cardTemplate,
            'add card template',
            async () => {
                this.showCard(cardTemplate.id)
            }, async () => {
                this.showCard(undefined)
            },
        )
    }

    private editCardTemplate = (cardTemplateId: string) => {
        this.showCard(cardTemplateId)
    }
}

export default injectIntl(TableComponent)
