// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
import React from 'react'
import {injectIntl, IntlShape, FormattedMessage} from 'react-intl'

import {BlockIcons} from '../blockIcons'
import {IPropertyOption, IPropertyTemplate} from '../blocks/board'
import {Card, MutableCard} from '../blocks/card'
import {BoardTree, BoardTreeGroup} from '../viewModel/boardTree'
import {CardFilter} from '../cardFilter'
import {Constants} from '../constants'
import mutator from '../mutator'
import {Utils} from '../utils'
import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'

import {BoardCard} from './boardCard'
import {BoardColumn} from './boardColumn'
import Button from './button'
import {CardDialog} from './cardDialog'
import {Editable} from './editable'
import RootPortal from './rootPortal'
import ViewHeader from './viewHeader'
import ViewTitle from './viewTitle'

type Props = {
    boardTree?: BoardTree
    showView: (id: string) => void
    setSearchText: (text: string) => void
    intl: IntlShape
}

type State = {
    isSearching: boolean
    shownCard?: Card
    viewMenu: boolean
    selectedCards: Card[]
    showFilter: boolean
}

class BoardComponent extends React.Component<Props, State> {
    private draggedCards: Card[] = []
    private draggedHeaderOption: IPropertyOption
    private backgroundRef = React.createRef<HTMLDivElement>()
    private searchFieldRef = React.createRef<Editable>()

    private keydownHandler = (e: KeyboardEvent) => {
        if (e.target !== document.body) {
            return
        }

        if (e.keyCode === 27) {
            if (this.state.selectedCards.length > 0) {
                this.setState({selectedCards: []})
                e.stopPropagation()
            }
        }
    }

    componentDidMount(): void {
        document.addEventListener('keydown', this.keydownHandler)
    }

    componentWillUnmount(): void {
        document.removeEventListener('keydown', this.keydownHandler)
    }

    constructor(props: Props) {
        super(props)
        this.state = {
            isSearching: Boolean(this.props.boardTree?.getSearchText()),
            viewMenu: false,
            selectedCards: [],
            showFilter: false,
        }
    }

    shouldComponentUpdate(): boolean {
        return true
    }

    componentDidUpdate(prevPros: Props, prevState: State): void {
        if (this.state.isSearching && !prevState.isSearching) {
            this.searchFieldRef.current.focus()
        }
    }

    render(): JSX.Element {
        const {boardTree, showView, intl} = this.props

        if (!boardTree || !boardTree.board) {
            return (
                <div>Loading...</div>
            )
        }

        const propertyValues = boardTree.groupByProperty?.options || []
        Utils.log(`${propertyValues.length} propertyValues`)

        const {board, activeView} = boardTree
        const visiblePropertyTemplates = board.cardProperties.filter((template) => activeView.visiblePropertyIds.includes(template.id))
        const visibleGroups = boardTree.groups.filter((group) => !group.isHidden)
        const hiddenGroups = boardTree.groups.filter((group) => group.isHidden)

        return (
            <div
                className='octo-app'
                ref={this.backgroundRef}
                onClick={(e) => {
                    this.backgroundClicked(e)
                }}
            >
                {this.state.shownCard &&
                <RootPortal>
                    <CardDialog
                        boardTree={boardTree}
                        card={this.state.shownCard}
                        onClose={() => this.setState({shownCard: undefined})}
                    />
                </RootPortal>}

                <div className='octo-frame'>
                    <ViewTitle board={board}/>

                    <div className='octo-board'>
                        <ViewHeader
                            boardTree={boardTree}
                            showView={showView}
                            setSearchText={this.props.setSearchText}
                            addCard={() => this.addCard()}
                            withGroupBy={true}
                        />
                        <div
                            className='octo-board-header'
                            id='mainBoardHeader'
                        >

                            {/* No value */}

                            <div className='octo-board-header-cell'>
                                <div
                                    className='octo-label'
                                    title={intl.formatMessage({
                                        id: 'BoardComponent.no-property-title',
                                        defaultMessage: 'Items with an empty {property} property will go here. This column cannot be removed.',
                                    }, {property: boardTree.groupByProperty?.name})}
                                >
                                    <FormattedMessage
                                        id='BoardComponent.no-property'
                                        defaultMessage='No {property}'
                                        values={{
                                            property: boardTree.groupByProperty?.name,
                                        }}
                                    />
                                </div>
                                <Button>{`${boardTree.emptyGroupCards.length}`}</Button>
                                <div className='octo-spacer'/>
                                <Button><div className='imageOptions'/></Button>
                                <Button
                                    onClick={() => {
                                        this.addCard(undefined)
                                    }}
                                ><div className='imageAdd'/></Button>
                            </div>

                            {/* Visible column headers */}

                            {visibleGroups.map((group) => this.renderColumnHeader(group))}

                            {/* Hidden column header */}

                            {hiddenGroups.length > 0 &&
                                <div className='octo-board-header-cell narrow'>
                                    <FormattedMessage
                                        id='BoardComponent.hidden-columns'
                                        defaultMessage='Hidden Columns'
                                    />
                                </div>}

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
                        </div>

                        {/* Main content */}

                        <div
                            className='octo-board-body'
                            id='mainBoardBody'
                        >

                            {/* No value column */}

                            <BoardColumn
                                onDrop={() => this.onDropToColumn(undefined)}
                            >
                                {boardTree.emptyGroupCards.map((card) => this.renderCard(card, visiblePropertyTemplates))}
                                <Button
                                    onClick={() => {
                                        this.addCard(undefined)
                                    }}
                                >
                                    <FormattedMessage
                                        id='BoardComponent.neww'
                                        defaultMessage='+ New'
                                    />
                                </Button>
                            </BoardColumn>

                            {/* Columns */}

                            {visibleGroups.map((group) => (
                                <BoardColumn
                                    key={group.option.id}
                                    onDrop={() => this.onDropToColumn(group.option)}
                                >
                                    {group.cards.map((card) => this.renderCard(card, visiblePropertyTemplates))}
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
        return (
            <BoardCard
                card={card}
                visiblePropertyTemplates={visiblePropertyTemplates}
                key={card.id}
                isSelected={this.state.selectedCards.includes(card)}
                onClick={(e) => {
                    this.cardClicked(e, card)
                }}
                onDragStart={() => {
                    this.draggedCards = this.state.selectedCards.includes(card) ? this.state.selectedCards : [card]
                }}
                onDragEnd={() => {
                    this.draggedCards = []
                }}
            />
        )
    }

    private renderColumnHeader(group: BoardTreeGroup) {
        const {boardTree, intl} = this.props
        const {activeView} = boardTree

        const ref = React.createRef<HTMLDivElement>()
        return (
            <div
                key={group.option.id}
                ref={ref}
                className='octo-board-header-cell'

                draggable={true}
                onDragStart={() => {
                    this.draggedHeaderOption = group.option
                }}
                onDragEnd={() => {
                    this.draggedHeaderOption = undefined
                }}

                onDragOver={(e) => {
                    ref.current.classList.add('dragover')
                    e.preventDefault()
                }}
                onDragEnter={(e) => {
                    ref.current.classList.add('dragover')
                    e.preventDefault()
                }}
                onDragLeave={(e) => {
                    ref.current.classList.remove('dragover')
                    e.preventDefault()
                }}
                onDrop={(e) => {
                    ref.current.classList.remove('dragover')
                    e.preventDefault()
                    this.onDropToColumn(group.option)
                }}
            >
                <Editable
                    className={`octo-label ${group.option.color}`}
                    text={group.option.value}
                    onChanged={(text) => {
                        this.propertyNameChanged(group.option, text)
                    }}
                />
                <Button>{`${group.cards.length}`}</Button>
                <div className='octo-spacer'/>
                <MenuWrapper>
                    <Button><div className='imageOptions'/></Button>
                    <Menu>
                        <Menu.Text
                            id='hide'
                            name={intl.formatMessage({id: 'BoardComponent.hide', defaultMessage: 'Hide'})}
                            onClick={() => mutator.hideViewColumn(activeView, group.option.id)}
                        />
                        <Menu.Text
                            id='delete'
                            name={intl.formatMessage({id: 'BoardComponent.delete', defaultMessage: 'Delete'})}
                            onClick={() => mutator.deletePropertyOption(boardTree, boardTree.groupByProperty, group.option)}
                        />
                        <Menu.Separator/>
                        {Constants.menuColors.map((color) =>
                            (<Menu.Color
                                key={color.id}
                                id={color.id}
                                name={color.name}
                                onClick={() => mutator.changePropertyOptionColor(boardTree.board, boardTree.groupByProperty, group.option, color.id)}
                            />),
                        )}
                    </Menu>
                </MenuWrapper>
                <Button
                    onClick={() => {
                        this.addCard(group.option.id)
                    }}
                ><div className='imageAdd'/></Button>
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
                key={group.option.id}
                className='octo-board-hidden-item'
                onDragOver={(e) => {
                    if (this.draggedCards?.length < 1) {
                        return
                    }
                    ref.current.classList.add('dragover')
                    e.preventDefault()
                }}
                onDragEnter={(e) => {
                    if (this.draggedCards?.length < 1) {
                        return
                    }
                    ref.current.classList.add('dragover')
                    e.preventDefault()
                }}
                onDragLeave={(e) => {
                    if (this.draggedCards?.length < 1) {
                        return
                    }
                    ref.current.classList.remove('dragover')
                    e.preventDefault()
                }}
                onDrop={(e) => {
                    (e.target as HTMLElement).classList.remove('dragover')
                    e.preventDefault()
                    if (this.draggedCards?.length < 1) {
                        return
                    }
                    this.onDropToColumn(group.option)
                }}
            >
                <MenuWrapper>
                    <div
                        key={group.option.id}
                        className={`octo-label ${group.option.color}`}
                    >
                        {group.option.value}
                    </div>
                    <Menu>
                        <Menu.Text
                            id='show'
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
        if (this.state.selectedCards.length > 0) {
            this.setState({selectedCards: []})
            e.stopPropagation()
        }
    }

    private async addCard(groupByOptionId?: string): Promise<void> {
        const {boardTree} = this.props
        const {activeView, board} = boardTree

        const card = new MutableCard()
        card.parentId = boardTree.board.id
        card.properties = CardFilter.propertiesThatMeetFilterGroup(activeView.filter, board.cardProperties)
        card.icon = BlockIcons.shared.randomIcon()
        if (boardTree.groupByProperty) {
            card.properties[boardTree.groupByProperty.id] = groupByOptionId
        }
        await mutator.insertBlock(card, 'add card', async () => {
            this.setState({shownCard: card})
        }, async () => {
            this.setState({shownCard: undefined})
        })
    }

    private async propertyNameChanged(option: IPropertyOption, text: string): Promise<void> {
        const {boardTree} = this.props

        await mutator.changePropertyOptionValue(boardTree, boardTree.groupByProperty, option, text)
    }

    private cardClicked(e: React.MouseEvent, card: Card): void {
        if (e.shiftKey) {
            // Shift+Click = add to selection
            let selectedCards = this.state.selectedCards.slice()
            if (selectedCards.includes(card)) {
                selectedCards = selectedCards.filter((o) => o != card)
            } else {
                selectedCards.push(card)
            }
            this.setState({selectedCards})
        } else {
            this.setState({selectedCards: [], shownCard: card})
        }

        e.stopPropagation()
    }

    private async addGroupClicked() {
        Utils.log('onAddGroupClicked')

        const {boardTree} = this.props

        const option: IPropertyOption = {
            id: Utils.createGuid(),
            value: 'New group',
            color: 'propColorDefault',
        }

        Utils.assert(boardTree.groupByProperty)
        await mutator.insertPropertyOption(boardTree, boardTree.groupByProperty, option, 'add group')
    }

    private async onDropToColumn(option: IPropertyOption) {
        const {boardTree} = this.props
        const {draggedCards, draggedHeaderOption} = this
        const optionId = option ? option.id : undefined

        Utils.assertValue(mutator)
        Utils.assertValue(boardTree)

        if (draggedCards.length > 0) {
            for (const draggedCard of draggedCards) {
                Utils.log(`ondrop. Card: ${draggedCard.title}, column: ${optionId}`)
                const oldValue = draggedCard.properties[boardTree.groupByProperty.id]
                if (optionId !== oldValue) {
                    await mutator.changePropertyValue(draggedCard, boardTree.groupByProperty.id, optionId, 'drag card')
                }
            }
        } else if (draggedHeaderOption) {
            Utils.log(`ondrop. Header option: ${draggedHeaderOption.value}, column: ${option?.value}`)
            Utils.assertValue(boardTree.groupByProperty)

            // Move option to new index
            const {board} = boardTree
            const options = boardTree.groupByProperty.options
            const destIndex = option ? options.indexOf(option) : 0

            await mutator.changePropertyOptionOrder(board, boardTree.groupByProperty, draggedHeaderOption, destIndex)
        }
    }
}

export default injectIntl(BoardComponent)
