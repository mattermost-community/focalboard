// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'
import Hotkeys from 'react-hot-keys'

import {BlockIcons} from '../blockIcons'
import {Card, MutableCard} from '../blocks/card'
import {CardFilter} from '../cardFilter'
import mutator from '../mutator'
import {Utils} from '../utils'
import {BoardTree} from '../viewModel/boardTree'
import {UserSettings} from '../userSettings'

import './centerPanel.scss'
import CardDialog from './cardDialog'
import RootPortal from './rootPortal'
import TopBar from './topBar'
import ViewHeader from './viewHeader/viewHeader'
import ViewTitle from './viewTitle'
import Kanban from './kanban/kanban'
import Table from './table/table'
import Gallery from './gallery/gallery'

type Props = {
    boardTree: BoardTree
    showView: (id: string) => void
    setSearchText: (text?: string) => void
    intl: IntlShape
    readonly: boolean
}

type State = {
    shownCardId?: string
    selectedCardIds: string[]
    cardIdToFocusOnRender: string
}

class CenterPanel extends React.Component<Props, State> {
    private backgroundRef = React.createRef<HTMLDivElement>()

    private keydownHandler = (keyName: string, e: KeyboardEvent) => {
        if (e.target !== document.body || this.props.readonly) {
            return
        }

        if (keyName === 'esc') {
            if (this.state.selectedCardIds.length > 0) {
                this.setState({selectedCardIds: []})
                e.stopPropagation()
            }
        }

        if (this.state.selectedCardIds.length > 0) {
            if (keyName === 'del' || keyName === 'backspace') {
                // Backspace or Del: Delete selected cards
                this.deleteSelectedCards()
                e.stopPropagation()
            }

            // TODO: Might need a different hotkey, as Cmd+D is save bookmark on Chrome
            if (keyName === 'ctrl+d') {
                // CTRL+D: Duplicate selected cards
                this.duplicateSelectedCards()
                e.stopPropagation()
                e.preventDefault()
            }
        }
    }

    componentDidMount(): void {
        this.showCardInUrl()
    }

    constructor(props: Props) {
        super(props)
        this.state = {
            selectedCardIds: [],
            cardIdToFocusOnRender: '',
        }
    }

    shouldComponentUpdate(): boolean {
        return true
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
        const {groupByProperty} = boardTree
        const {activeView} = boardTree

        if (!groupByProperty && activeView.viewType === 'board') {
            Utils.assertFailure('Board views must have groupByProperty set')
            return <div/>
        }

        const {board} = boardTree

        return (
            <div
                className='BoardComponent'
                ref={this.backgroundRef}
                onClick={(e) => {
                    this.backgroundClicked(e)
                }}
            >
                <Hotkeys
                    keyName='ctrl+d,del,esc,backspace'
                    onKeyDown={this.keydownHandler}
                />
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

                <div className='top-head'>
                    <TopBar/>
                    <ViewTitle
                        key={board.id + board.title}
                        board={board}
                        readonly={this.props.readonly}
                    />
                    <ViewHeader
                        boardTree={boardTree}
                        showView={showView}
                        setSearchText={this.props.setSearchText}
                        addCard={() => this.addCard('', true)}
                        addCardFromTemplate={this.addCardFromTemplate}
                        addCardTemplate={this.addCardTemplate}
                        editCardTemplate={this.editCardTemplate}
                        readonly={this.props.readonly}
                    />
                </div>

                {activeView.viewType === 'board' &&
                <Kanban
                    boardTree={boardTree}
                    selectedCardIds={this.state.selectedCardIds}
                    readonly={this.props.readonly}
                    onCardClicked={this.cardClicked}
                    addCard={this.addCard}
                />}

                {activeView.viewType === 'table' &&
                <Table
                    boardTree={boardTree}
                    selectedCardIds={this.state.selectedCardIds}
                    readonly={this.props.readonly}
                    cardIdToFocusOnRender={this.state.cardIdToFocusOnRender}
                    showCard={this.showCard}
                    addCard={this.addCard}
                    onCardClicked={this.cardClicked}
                />}

                {activeView.viewType === 'gallery' &&
                <Gallery
                    boardTree={boardTree}
                    readonly={this.props.readonly}
                    onCardClicked={this.cardClicked}
                    selectedCardIds={this.state.selectedCardIds}
                    addCard={(show) => this.addCard('', show)}
                />}

            </div>
        )
    }

    private backgroundClicked(e: React.MouseEvent) {
        if (this.state.selectedCardIds.length > 0) {
            this.setState({selectedCardIds: []})
            e.stopPropagation()
        }
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

    addCard = async (groupByOptionId?: string, show = false): Promise<void> => {
        const {boardTree} = this.props
        const {activeView, board} = boardTree

        const card = new MutableCard()

        card.parentId = boardTree.board.id
        card.rootId = boardTree.board.rootId
        const propertiesThatMeetFilters = CardFilter.propertiesThatMeetFilterGroup(activeView.filter, board.cardProperties)
        if ((activeView.viewType === 'board' || activeView.viewType === 'table') && boardTree.groupByProperty) {
            if (groupByOptionId) {
                propertiesThatMeetFilters[boardTree.groupByProperty.id] = groupByOptionId
            } else {
                delete propertiesThatMeetFilters[boardTree.groupByProperty.id]
            }
        }
        card.properties = {...card.properties, ...propertiesThatMeetFilters}
        if (!card.icon && UserSettings.prefillRandomIcons) {
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
            async () => {
                this.showCard(undefined)
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

    cardClicked = (e: React.MouseEvent, card: Card): void => {
        const {boardTree} = this.props
        const {activeView} = boardTree

        if (e.shiftKey) {
            let selectedCardIds = this.state.selectedCardIds.slice()
            if (selectedCardIds.length > 0 && (e.metaKey || e.ctrlKey)) {
                // Cmd+Shift+Click: Extend the selection
                const orderedCardIds = boardTree.orderedCards().map((o) => o.id)
                const lastCardId = selectedCardIds[selectedCardIds.length - 1]
                const srcIndex = orderedCardIds.indexOf(lastCardId)
                const destIndex = orderedCardIds.indexOf(card.id)
                const newCardIds = (srcIndex < destIndex) ? orderedCardIds.slice(srcIndex, destIndex + 1) : orderedCardIds.slice(destIndex, srcIndex + 1)
                for (const newCardId of newCardIds) {
                    if (!selectedCardIds.includes(newCardId)) {
                        selectedCardIds.push(newCardId)
                    }
                }
                this.setState({selectedCardIds})
            } else {
                // Shift+Click: add to selection
                if (selectedCardIds.includes(card.id)) {
                    selectedCardIds = selectedCardIds.filter((o) => o !== card.id)
                } else {
                    selectedCardIds.push(card.id)
                }
                this.setState({selectedCardIds})
            }
        } else if (activeView.viewType === 'board' || activeView.viewType === 'gallery') {
            this.showCard(card.id)
        }

        e.stopPropagation()
    }

    private showCard = (cardId?: string) => {
        Utils.replaceUrlQueryParam('c', cardId)
        this.setState({selectedCardIds: [], shownCardId: cardId})
    }

    private async deleteSelectedCards() {
        const {selectedCardIds} = this.state
        if (selectedCardIds.length < 1) {
            return
        }

        mutator.performAsUndoGroup(async () => {
            for (const cardId of selectedCardIds) {
                const card = this.props.boardTree.allCards.find((o) => o.id === cardId)
                if (card) {
                    mutator.deleteBlock(card, selectedCardIds.length > 1 ? `delete ${selectedCardIds.length} cards` : 'delete card')
                } else {
                    Utils.assertFailure(`Selected card not found: ${cardId}`)
                }
            }
        })

        this.setState({selectedCardIds: []})
    }

    private async duplicateSelectedCards() {
        const {selectedCardIds} = this.state
        if (selectedCardIds.length < 1) {
            return
        }

        mutator.performAsUndoGroup(async () => {
            for (const cardId of selectedCardIds) {
                const card = this.props.boardTree.allCards.find((o) => o.id === cardId)
                if (card) {
                    mutator.duplicateCard(cardId)
                } else {
                    Utils.assertFailure(`Selected card not found: ${cardId}`)
                }
            }
        })

        this.setState({selectedCardIds: []})
    }
}

export default injectIntl(CenterPanel)
