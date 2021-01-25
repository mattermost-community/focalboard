// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
import React from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import {BlockIcons} from '../blockIcons'
import {IPropertyOption, IPropertyTemplate} from '../blocks/board'
import {Card, MutableCard} from '../blocks/card'
import {CardFilter} from '../cardFilter'
import {Constants} from '../constants'
import mutator from '../mutator'
import {Utils} from '../utils'
import {BoardTree, BoardTreeGroup} from '../viewModel/boardTree'
import Button from '../widgets/buttons/button'
import IconButton from '../widgets/buttons/iconButton'
import AddIcon from '../widgets/icons/add'
import DeleteIcon from '../widgets/icons/delete'
import HideIcon from '../widgets/icons/hide'
import OptionsIcon from '../widgets/icons/options'
import ShowIcon from '../widgets/icons/show'
import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'

import BoardCard from './boardCard'
import {BoardColumn} from './boardColumn'
import './boardComponent.scss'
import CardDialog from './cardDialog'
import {Editable} from './editable'
import RootPortal from './rootPortal'
import TopBar from './topBar'
import ViewHeader from './viewHeader'
import ViewTitle from './viewTitle'

type Props = {
    boardTree: BoardTree
    showView: (id: string) => void
    setSearchText: (text?: string) => void
    intl: IntlShape
    readonly: boolean
}

type State = {
    isSearching: boolean
    shownCardId?: string
    viewMenu: boolean
    selectedCardIds: string[]
    showFilter: boolean
}

class BoardComponent extends React.Component<Props, State> {
    private draggedCards: Card[] = []
    private draggedHeaderOption?: IPropertyOption
    private backgroundRef = React.createRef<HTMLDivElement>()
    private searchFieldRef = React.createRef<Editable>()

    private keydownHandler = (e: KeyboardEvent) => {
        if (e.target !== document.body) {
            return
        }

        if (e.keyCode === 27) {
            if (this.state.selectedCardIds.length > 0) {
                this.setState({selectedCardIds: []})
                e.stopPropagation()
            }
        }

        if (e.keyCode === 8 || e.keyCode === 46) {
            // Backspace or Del: Delete selected cards
            this.deleteSelectedCards()
            e.stopPropagation()
        }
    }

    componentDidMount(): void {
        this.showCardInUrl()
        document.addEventListener('keydown', this.keydownHandler)
    }

    componentWillUnmount(): void {
        document.removeEventListener('keydown', this.keydownHandler)
    }

    constructor(props: Props) {
        super(props)
        this.state = {
            isSearching: Boolean(this.props.boardTree.getSearchText()),
            viewMenu: false,
            selectedCardIds: [],
            showFilter: false,
        }
    }

    shouldComponentUpdate(): boolean {
        return true
    }

    componentDidUpdate(prevPros: Props, prevState: State): void {
        if (this.state.isSearching && !prevState.isSearching) {
            this.searchFieldRef.current?.focus()
        }
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

        if (!groupByProperty) {
            Utils.assertFailure('Board views must have groupByProperty set')
            return <div/>
        }

        const propertyValues = groupByProperty.options || []
        Utils.log(`${propertyValues.length} propertyValues`)

        const {board, activeView, visibleGroups, hiddenGroups} = boardTree
        const visiblePropertyTemplates = board.cardProperties.filter((template) => activeView.visiblePropertyIds.includes(template.id))
        const isManualSort = activeView.sortOptions.length < 1

        return (
            <div
                className='BoardComponent octo-app'
                ref={this.backgroundRef}
                onClick={(e) => {
                    this.backgroundClicked(e)
                }}
            >
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

                    <div className='octo-board'>
                        <ViewHeader
                            boardTree={boardTree}
                            showView={showView}
                            setSearchText={this.props.setSearchText}
                            addCard={() => this.addCard()}
                            addCardFromTemplate={this.addCardFromTemplate}
                            addCardTemplate={this.addCardTemplate}
                            editCardTemplate={this.editCardTemplate}
                            withGroupBy={true}
                            readonly={this.props.readonly}
                        />
                        <div
                            className='octo-board-header'
                            id='mainBoardHeader'
                        >
                            {/* Column headers */}

                            {visibleGroups.map((group) => this.renderColumnHeader(group))}

                            {/* Hidden column header */}

                            {hiddenGroups.length > 0 &&
                                <div className='octo-board-header-cell narrow'>
                                    <FormattedMessage
                                        id='BoardComponent.hidden-columns'
                                        defaultMessage='Hidden columns'
                                    />
                                </div>
                            }

                            {!this.props.readonly &&
                                <div className='octo-board-header-cell narrow'>
                                    <Button
                                        onClick={this.addGroupClicked}
                                    >
                                        <FormattedMessage
                                            id='BoardComponent.add-a-group'
                                            defaultMessage='+ Add a group'
                                        />
                                    </Button>
                                </div>
                            }
                        </div>

                        {/* Main content */}

                        <div
                            className='octo-board-body'
                            id='mainBoardBody'
                        >
                            {/* Columns */}

                            {visibleGroups.map((group) => (
                                <BoardColumn
                                    key={group.option.id || 'empty'}
                                    isDropZone={!isManualSort || group.cards.length < 1}
                                    onDrop={() => this.onDropToColumn(group.option)}
                                >
                                    {group.cards.map((card) => this.renderCard(card, visiblePropertyTemplates))}
                                    {!this.props.readonly &&
                                        <Button
                                            onClick={() => {
                                                this.addCard(group.option.id)
                                            }}
                                        >
                                            <FormattedMessage
                                                id='BoardComponent.neww'
                                                defaultMessage='+ New'
                                            />
                                        </Button>
                                    }
                                </BoardColumn>
                            ))}

                            {/* Hidden columns */}

                            {hiddenGroups.length > 0 &&
                                <div className='octo-board-column narrow'>
                                    {hiddenGroups.map((group) => this.renderHiddenColumnItem(group))}
                                </div>}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    private renderCard(card: Card, visiblePropertyTemplates: IPropertyTemplate[]) {
        const {boardTree} = this.props
        const {activeView} = boardTree
        const isManualSort = activeView.sortOptions.length < 1
        return (
            <BoardCard
                card={card}
                visiblePropertyTemplates={visiblePropertyTemplates}
                key={card.id}
                readonly={this.props.readonly}
                isSelected={this.state.selectedCardIds.includes(card.id)}
                onClick={(e) => {
                    this.cardClicked(e, card)
                }}
                onDragStart={() => {
                    if (this.state.selectedCardIds.includes(card.id)) {
                        this.draggedCards = this.state.selectedCardIds.map((id) => boardTree.allCards.find((o) => o.id === id)!)
                    } else {
                        this.draggedCards = [card]
                    }
                }}
                onDragEnd={() => {
                    this.draggedCards = []
                }}

                isDropZone={isManualSort}
                onDrop={() => {
                    this.onDropToCard(card)
                }}
            />
        )
    }

    private renderColumnHeader(group: BoardTreeGroup) {
        const {boardTree, intl} = this.props
        const {activeView} = boardTree

        // TODO: Refactor this as a component
        if (!group.option.id) {
            // Empty group
            const ref = React.createRef<HTMLDivElement>()
            return (
                <div
                    key='empty'
                    ref={ref}
                    className='octo-board-header-cell'

                    draggable={!this.props.readonly}
                    onDragStart={() => {
                        this.draggedHeaderOption = group.option
                    }}
                    onDragEnd={() => {
                        this.draggedHeaderOption = undefined
                    }}

                    onDragOver={(e) => {
                        ref.current?.classList.add('dragover')
                        e.preventDefault()
                    }}
                    onDragEnter={(e) => {
                        ref.current?.classList.add('dragover')
                        e.preventDefault()
                    }}
                    onDragLeave={(e) => {
                        ref.current?.classList.remove('dragover')
                        e.preventDefault()
                    }}
                    onDrop={(e) => {
                        ref.current?.classList.remove('dragover')
                        e.preventDefault()
                        this.onDropToColumn(group.option)
                    }}
                >
                    <div
                        className='octo-label'
                        title={intl.formatMessage({
                            id: 'BoardComponent.no-property-title',
                            defaultMessage: 'Items with an empty {property} property will go here. This column cannot be removed.',
                        }, {property: boardTree.groupByProperty!.name})}
                    >
                        <FormattedMessage
                            id='BoardComponent.no-property'
                            defaultMessage='No {property}'
                            values={{
                                property: boardTree.groupByProperty!.name,
                            }}
                        />
                    </div>
                    <Button>{`${group.cards.length}`}</Button>
                    <div className='octo-spacer'/>
                    {!this.props.readonly &&
                        <>
                            <MenuWrapper>
                                <IconButton icon={<OptionsIcon/>}/>
                                <Menu>
                                    <Menu.Text
                                        id='hide'
                                        icon={<HideIcon/>}
                                        name={intl.formatMessage({id: 'BoardComponent.hide', defaultMessage: 'Hide'})}
                                        onClick={() => mutator.hideViewColumn(activeView, '')}
                                    />
                                </Menu>
                            </MenuWrapper>
                            <IconButton
                                icon={<AddIcon/>}
                                onClick={() => this.addCard(undefined)}
                            />
                        </>
                    }
                </div>
            )
        }

        const ref = React.createRef<HTMLDivElement>()
        return (
            <div
                key={group.option.id}
                ref={ref}
                className='octo-board-header-cell'

                draggable={!this.props.readonly}
                onDragStart={() => {
                    this.draggedHeaderOption = group.option
                }}
                onDragEnd={() => {
                    this.draggedHeaderOption = undefined
                }}

                onDragOver={(e) => {
                    ref.current?.classList.add('dragover')
                    e.preventDefault()
                }}
                onDragEnter={(e) => {
                    ref.current?.classList.add('dragover')
                    e.preventDefault()
                }}
                onDragLeave={(e) => {
                    ref.current?.classList.remove('dragover')
                    e.preventDefault()
                }}
                onDrop={(e) => {
                    ref.current?.classList.remove('dragover')
                    e.preventDefault()
                    this.onDropToColumn(group.option)
                }}
            >
                <Editable
                    className={`octo-label ${group.option.color}`}
                    text={group.option.value}
                    placeholderText='New Select'
                    allowEmpty={false}
                    onChanged={(text) => {
                        this.propertyNameChanged(group.option, text)
                    }}
                    readonly={this.props.readonly}
                />
                <Button>{`${group.cards.length}`}</Button>
                <div className='octo-spacer'/>
                {!this.props.readonly &&
                    <>
                        <MenuWrapper>
                            <IconButton icon={<OptionsIcon/>}/>
                            <Menu>
                                <Menu.Text
                                    id='hide'
                                    icon={<HideIcon/>}
                                    name={intl.formatMessage({id: 'BoardComponent.hide', defaultMessage: 'Hide'})}
                                    onClick={() => mutator.hideViewColumn(activeView, group.option.id)}
                                />
                                <Menu.Text
                                    id='delete'
                                    icon={<DeleteIcon/>}
                                    name={intl.formatMessage({id: 'BoardComponent.delete', defaultMessage: 'Delete'})}
                                    onClick={() => mutator.deletePropertyOption(boardTree, boardTree.groupByProperty!, group.option)}
                                />
                                <Menu.Separator/>
                                {Constants.menuColors.map((color) => (
                                    <Menu.Color
                                        key={color.id}
                                        id={color.id}
                                        name={color.name}
                                        onClick={() => mutator.changePropertyOptionColor(boardTree.board, boardTree.groupByProperty!, group.option, color.id)}
                                    />
                                ))}
                            </Menu>
                        </MenuWrapper>
                        <IconButton
                            icon={<AddIcon/>}
                            onClick={() => this.addCard(group.option.id)}
                        />
                    </>
                }
            </div>
        )
    }

    private renderHiddenColumnItem(group: BoardTreeGroup) {
        const {boardTree, intl} = this.props
        const {activeView} = boardTree

        const ref = React.createRef<HTMLDivElement>()
        return (
            <div
                ref={ref}
                key={group.option.id || 'empty'}
                className='octo-board-hidden-item'
                onDragOver={(e) => {
                    if (this.draggedCards?.length < 1) {
                        return
                    }
                    ref.current?.classList.add('dragover')
                    e.preventDefault()
                }}
                onDragEnter={(e) => {
                    if (this.draggedCards?.length < 1) {
                        return
                    }
                    ref.current?.classList.add('dragover')
                    e.preventDefault()
                }}
                onDragLeave={(e) => {
                    if (this.draggedCards?.length < 1) {
                        return
                    }
                    ref.current?.classList.remove('dragover')
                    e.preventDefault()
                }}
                onDrop={(e) => {
                    ref.current?.classList.remove('dragover')
                    e.preventDefault()
                    if (this.draggedCards?.length < 1) {
                        return
                    }
                    this.onDropToColumn(group.option)
                }}
            >
                <MenuWrapper
                    disabled={this.props.readonly}
                >
                    <div
                        key={group.option.id || 'empty'}
                        className={`octo-label ${group.option.color}`}
                    >
                        {group.option.value}
                    </div>
                    <Menu>
                        <Menu.Text
                            id='show'
                            icon={<ShowIcon/>}
                            name={intl.formatMessage({id: 'BoardComponent.show', defaultMessage: 'Show'})}
                            onClick={() => mutator.unhideViewColumn(activeView, group.option.id)}
                        />
                    </Menu>
                </MenuWrapper>
                <Button>{`${group.cards.length}`}</Button>
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

    private async addCard(groupByOptionId?: string): Promise<void> {
        const {boardTree} = this.props
        const {activeView, board} = boardTree

        const card = new MutableCard()

        card.parentId = boardTree.board.id
        card.rootId = boardTree.board.rootId
        const propertiesThatMeetFilters = CardFilter.propertiesThatMeetFilterGroup(activeView.filter, board.cardProperties)
        if (boardTree.groupByProperty) {
            if (groupByOptionId) {
                propertiesThatMeetFilters[boardTree.groupByProperty.id] = groupByOptionId
            } else {
                delete propertiesThatMeetFilters[boardTree.groupByProperty.id]
            }
        }
        card.properties = {...card.properties, ...propertiesThatMeetFilters}
        if (!card.icon) {
            card.icon = BlockIcons.shared.randomIcon()
        }
        await mutator.insertBlock(
            card,
            'add card',
            async () => {
                this.showCard(card.id)
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

    private async propertyNameChanged(option: IPropertyOption, text: string): Promise<void> {
        const {boardTree} = this.props

        await mutator.changePropertyOptionValue(boardTree, boardTree.groupByProperty!, option, text)
    }

    private cardClicked(e: React.MouseEvent, card: Card): void {
        if (e.shiftKey) {
            let selectedCardIds = this.state.selectedCardIds.slice()
            if (selectedCardIds.length > 0 && (e.metaKey || e.ctrlKey)) {
                // Cmd+Shift+Click: Extend the selection
                const {boardTree} = this.props
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
        } else {
            this.showCard(card.id)
        }

        e.stopPropagation()
    }

    private showCard = (cardId?: string) => {
        Utils.replaceUrlQueryParam('c', cardId)
        this.setState({selectedCardIds: [], shownCardId: cardId})
    }

    private addGroupClicked = async () => {
        Utils.log('onAddGroupClicked')

        const {boardTree} = this.props

        const option: IPropertyOption = {
            id: Utils.createGuid(),
            value: 'New group',
            color: 'propColorDefault',
        }

        await mutator.insertPropertyOption(boardTree, boardTree.groupByProperty!, option, 'add group')
    }

    private async onDropToColumn(option: IPropertyOption) {
        const {boardTree} = this.props
        const {draggedCards, draggedHeaderOption} = this
        const optionId = option ? option.id : undefined

        Utils.assertValue(boardTree)

        if (draggedCards.length > 0) {
            await mutator.performAsUndoGroup(async () => {
                const description = draggedCards.length > 1 ? `drag ${draggedCards.length} cards` : 'drag card'
                const awaits = []
                for (const draggedCard of draggedCards) {
                    Utils.log(`ondrop. Card: ${draggedCard.title}, column: ${optionId}`)
                    const oldValue = draggedCard.properties[boardTree.groupByProperty!.id]
                    if (optionId !== oldValue) {
                        awaits.push(mutator.changePropertyValue(draggedCard, boardTree.groupByProperty!.id, optionId, description))
                    }
                }
                await Promise.all(awaits)
            })
        } else if (draggedHeaderOption) {
            Utils.log(`ondrop. Header option: ${draggedHeaderOption.value}, column: ${option?.value}`)

            // Move option to new index
            const visibleOptionIds = boardTree.visibleGroups.map((o) => o.option.id)

            const {activeView} = boardTree
            const srcIndex = visibleOptionIds.indexOf(draggedHeaderOption.id)
            const destIndex = visibleOptionIds.indexOf(option.id)

            visibleOptionIds.splice(destIndex, 0, visibleOptionIds.splice(srcIndex, 1)[0])

            await mutator.changeViewVisibleOptionIds(activeView, visibleOptionIds)
        }
    }

    private async onDropToCard(card: Card) {
        Utils.log(`onDropToCard: ${card.title}`)
        const {boardTree} = this.props
        const {activeView} = boardTree
        const {draggedCards} = this
        const optionId = card.properties[activeView.groupById!]

        if (draggedCards.length < 1 || draggedCards.includes(card)) {
            return
        }

        const description = draggedCards.length > 1 ? `drag ${draggedCards.length} cards` : 'drag card'

        // Update card order
        let cardOrder = boardTree.orderedCards().map((o) => o.id)
        const draggedCardIds = draggedCards.map((o) => o.id)
        const firstDraggedCard = draggedCards[0]
        const isDraggingDown = cardOrder.indexOf(firstDraggedCard.id) <= cardOrder.indexOf(card.id)
        cardOrder = cardOrder.filter((id) => !draggedCardIds.includes(id))
        let destIndex = cardOrder.indexOf(card.id)
        if (firstDraggedCard.properties[boardTree.groupByProperty!.id] === optionId && isDraggingDown) {
            // If the cards are in the same column and dragging down, drop after the target card
            destIndex += 1
        }
        cardOrder.splice(destIndex, 0, ...draggedCardIds)

        await mutator.performAsUndoGroup(async () => {
            // Update properties of dragged cards
            const awaits = []
            for (const draggedCard of draggedCards) {
                Utils.log(`draggedCard: ${draggedCard.title}, column: ${optionId}`)
                const oldOptionId = draggedCard.properties[boardTree.groupByProperty!.id]
                if (optionId !== oldOptionId) {
                    awaits.push(mutator.changePropertyValue(draggedCard, boardTree.groupByProperty!.id, optionId, description))
                }
            }
            await Promise.all(awaits)
            await mutator.changeViewCardOrder(activeView, cardOrder, description)
        })
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
}

export default injectIntl(BoardComponent)
