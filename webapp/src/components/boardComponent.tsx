// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
import React from 'react'
import {FormattedMessage} from 'react-intl'

import {Archiver} from '../archiver'
import {ISortOption} from '../blocks/boardView'
import {BlockIcons} from '../blockIcons'
import {IPropertyOption, IPropertyTemplate} from '../blocks/board'
import {Card, MutableCard} from '../blocks/card'
import {BoardTree, BoardTreeGroup} from '../viewModel/boardTree'
import {CsvExporter} from '../csvExporter'
import {CardFilter} from '../cardFilter'
import ViewMenu from '../components/viewMenu'
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
import {FilterComponent} from './filterComponent'

type Props = {
    boardTree?: BoardTree
    showView: (id: string) => void
    setSearchText: (text: string) => void
}

type State = {
    isSearching: boolean
    shownCard?: Card
    viewMenu: boolean
    isHoverOnCover: boolean
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
            isHoverOnCover: false,
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
        const {boardTree, showView} = this.props

        if (!boardTree || !boardTree.board) {
            return (
                <div>Loading...</div>
            )
        }

        const propertyValues = boardTree.groupByProperty?.options || []
        Utils.log(`${propertyValues.length} propertyValues`)

        const groupByStyle = {color: '#000000'}
        const {board, activeView} = boardTree
        const visiblePropertyTemplates = board.cardProperties.filter((template) => activeView.visiblePropertyIds.includes(template.id))
        const hasFilter = activeView.filter && activeView.filter.filters?.length > 0
        const hasSort = activeView.sortOptions.length > 0
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
                    <div
                        className='octo-hovercontrols'
                        onMouseOver={() => {
                            this.setState({...this.state, isHoverOnCover: true})
                        }}
                        onMouseLeave={() => {
                            this.setState({...this.state, isHoverOnCover: false})
                        }}
                    >
                        <Button
                            style={{display: (!board.icon && this.state.isHoverOnCover) ? null : 'none'}}
                            onClick={() => {
                                const newIcon = BlockIcons.shared.randomIcon()
                                mutator.changeIcon(board, newIcon)
                            }}
                        >Add Icon</Button>
                    </div>

                    <div className='octo-icontitle'>
                        {board.icon ?
                            <MenuWrapper>
                                <div className='octo-button octo-icon'>{board.icon}</div>
                                <Menu>
                                    <Menu.Text
                                        id='random'
                                        name='Random'
                                        onClick={() => mutator.changeIcon(board, BlockIcons.shared.randomIcon())}
                                    />
                                    <Menu.Text
                                        id='remove'
                                        name='Remove Icon'
                                        onClick={() => mutator.changeIcon(board, undefined, 'remove icon')}
                                    />
                                </Menu>
                            </MenuWrapper> :
                            undefined}
                        <Editable
                            className='title'
                            text={board.title}
                            placeholderText='Untitled Board'
                            onChanged={(text) => {
                                mutator.changeTitle(board, text)
                            }}
                        />
                    </div>

                    <div className='octo-board'>
                        <div className='octo-controls'>
                            <Editable
                                style={{color: '#000000', fontWeight: 600}}
                                text={activeView.title}
                                placeholderText='Untitled View'
                                onChanged={(text) => {
                                    mutator.changeTitle(activeView, text)
                                }}
                            />
                            <MenuWrapper>
                                <div
                                    className='octo-button'
                                    style={{color: '#000000', fontWeight: 600}}
                                >
                                    <div className='imageDropdown'/>
                                </div>
                                <ViewMenu
                                    board={board}
                                    boardTree={boardTree}
                                    showView={showView}
                                />
                            </MenuWrapper>
                            <div className='octo-spacer'/>
                            <MenuWrapper>
                                <div className={'octo-button'}>
                                    <FormattedMessage
                                        id='TableComponent.properties'
                                        defaultMessage='Properties'
                                    />
                                </div>
                                <Menu>
                                    {boardTree.board.cardProperties.map((option) => (
                                        <Menu.Switch
                                            key={option.id}
                                            id={option.id}
                                            name={option.name}
                                            isOn={activeView.visiblePropertyIds.includes(option.id)}
                                            onClick={(propertyId: string) => {
                                                const property = boardTree.board.cardProperties.find((o) => o.id === propertyId)
                                                Utils.assertValue(property)
                                                Utils.log(`Toggle property ${property.name}`)

                                                let newVisiblePropertyIds = []
                                                if (activeView.visiblePropertyIds.includes(propertyId)) {
                                                    newVisiblePropertyIds = activeView.visiblePropertyIds.filter((o) => o !== propertyId)
                                                } else {
                                                    newVisiblePropertyIds = [...activeView.visiblePropertyIds, propertyId]
                                                }
                                                mutator.changeViewVisibleProperties(activeView, newVisiblePropertyIds)
                                            }}
                                        />
                                    ))}
                                </Menu>
                            </MenuWrapper>
                            <MenuWrapper>
                                <div
                                    className='octo-button'
                                    id='groupByButton'
                                >
                                    Group by <span
                                        style={groupByStyle}
                                        id='groupByLabel'
                                             >{boardTree.groupByProperty?.name}</span>
                                </div>
                                <Menu>
                                    {boardTree.board.cardProperties.filter((o) => o.type === 'select').map((option) => (
                                        <Menu.Text
                                            key={option.id}
                                            id={option.id}
                                            name={option.name}
                                            onClick={(id) => {
                                                if (boardTree.activeView.groupById === id) {
                                                    return
                                                }

                                                mutator.changeViewGroupById(boardTree.activeView, id)
                                            }}
                                        />
                                    ))}
                                </Menu>
                            </MenuWrapper>
                            <div
                                className={hasFilter ? 'octo-button active' : 'octo-button'}
                                style={{position: 'relative', overflow: 'unset'}}
                                onClick={this.filterClicked}
                            >
                                <FormattedMessage
                                    id='TableComponent.filter'
                                    defaultMessage='Filter'
                                />
                                {this.state.showFilter &&
                                    <FilterComponent
                                        boardTree={boardTree}
                                        onClose={this.hideFilter}
                                    />}
                            </div>
                            <MenuWrapper>
                                <div className={hasSort ? 'octo-button active' : 'octo-button'}>
                                    <FormattedMessage
                                        id='TableComponent.sort'
                                        defaultMessage='Sort'
                                    />
                                </div>
                                <Menu>
                                    {boardTree.board.cardProperties.map((option) => (
                                        <Menu.Text
                                            key={option.id}
                                            id={option.id}
                                            name={option.name}
                                            icon={(activeView.sortOptions[0]?.propertyId === option.id) ? activeView.sortOptions[0].reversed ? 'sortUp' : 'sortDown' : undefined}
                                            onClick={(propertyId: string) => {
                                                let newSortOptions: ISortOption[] = []
                                                if (activeView.sortOptions[0] && activeView.sortOptions[0].propertyId === propertyId) {
                                                    // Already sorting by name, so reverse it
                                                    newSortOptions = [
                                                        {propertyId, reversed: !activeView.sortOptions[0].reversed},
                                                    ]
                                                } else {
                                                    newSortOptions = [
                                                        {propertyId, reversed: false},
                                                    ]
                                                }
                                                mutator.changeViewSortOptions(activeView, newSortOptions)
                                            }}
                                        />
                                    ))}
                                </Menu>
                            </MenuWrapper>
                            {this.state.isSearching ?
                                <Editable
                                    ref={this.searchFieldRef}
                                    text={boardTree.getSearchText()}
                                    placeholderText='Search text'
                                    style={{color: '#000000'}}
                                    onChanged={(text) => {
                                        this.searchChanged(text)
                                    }}
                                    onKeyDown={(e) => {
                                        this.onSearchKeyDown(e)
                                    }}
                                /> :
                                <div
                                    className='octo-button'
                                    onClick={() => {
                                        this.setState({...this.state, isSearching: true})
                                    }}
                                >Search</div>
                            }
                            <MenuWrapper>
                                <div className='imageOptions'/>
                                <Menu>
                                    <Menu.Text
                                        id='exportCsv'
                                        name='Export to CSV'
                                        onClick={() => CsvExporter.exportTableCsv(boardTree)}
                                    />
                                    <Menu.Text
                                        id='exportBoardArchive'
                                        name='Export board archive'
                                        onClick={() => Archiver.exportBoardTree(boardTree)}
                                    />
                                    <Menu.Text
                                        id='testAdd100Cards'
                                        name='TEST: Add 100 cards'
                                        onClick={() => this.testAddCards(100)}
                                    />
                                    <Menu.Text
                                        id='testAdd1000Cards'
                                        name='TEST: Add 1,000 cards'
                                        onClick={() => this.testAddCards(1000)}
                                    />
                                    <Menu.Text
                                        id='testRandomizeIcons'
                                        name='TEST: Randomize icons'
                                        onClick={() => this.testRandomizeIcons()}
                                    />
                                </Menu>
                            </MenuWrapper>
                            <div
                                className='octo-button filled'
                                onClick={() => {
                                    this.addCard(undefined)
                                }}
                            >New</div>
                        </div>

                        {/* Headers */}

                        <div
                            className='octo-board-header'
                            id='mainBoardHeader'
                        >

                            {/* No value */}

                            <div className='octo-board-header-cell'>
                                <div
                                    className='octo-label'
                                    title={`Items with an empty ${boardTree.groupByProperty?.name} property will go here. This column cannot be removed.`}
                                >{`No ${boardTree.groupByProperty?.name}`}</div>
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

                            {(() => {
                                if (hiddenGroups.length > 0) {
                                    return <div className='octo-board-header-cell narrow'>Hidden columns</div>
                                }
                            })()}

                            <div className='octo-board-header-cell narrow'>
                                <Button
                                    onClick={(e) => {
                                        this.addGroupClicked()
                                    }}
                                >+ Add a group</Button>
                            </div>
                        </div>

                        {/* Main content */}

                        <div
                            className='octo-board-body'
                            id='mainBoardBody'
                        >

                            {/* No value column */}

                            <BoardColumn
                                onDrop={(e) => {
                                    this.onDropToColumn(undefined)
                                }}
                            >
                                {boardTree.emptyGroupCards.map((card) => this.renderCard(card, visiblePropertyTemplates))}
                                <Button
                                    onClick={() => {
                                        this.addCard(undefined)
                                    }}
                                >+ New</Button>
                            </BoardColumn>

                            {/* Columns */}

                            {visibleGroups.map((group) => (
                                <BoardColumn
                                    key={group.option.id}
                                    onDrop={(e) => {
                                        this.onDropToColumn(group.option)
                                    }}
                                >
                                    {group.cards.map((card) => this.renderCard(card, visiblePropertyTemplates))}
                                    <Button
                                        onClick={() => {
                                            this.addCard(group.option.id)
                                        }}
                                    >+ New</Button>
                                </BoardColumn>
                            ))}

                            {/* Hidden columns */}

                            {(() => {
                                if (hiddenGroups.length > 0) {
                                    return (
                                        <div className='octo-board-column narrow'>
                                            {hiddenGroups.map((group) => this.renderHiddenColumnItem(group))}
                                        </div>
                                    )
                                }
                            })()}

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
        const {boardTree} = this.props
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
                            name='Hide'
                            onClick={() => mutator.hideViewColumn(activeView, group.option.id)}
                        />
                        <Menu.Text
                            id='delete'
                            name='Delete'
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
        const {boardTree} = this.props
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
                            name='Show'
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

    private filterClicked = () => {
        this.setState({showFilter: true})
    }

    private hideFilter = () => {
        this.setState({showFilter: false})
    }

    private async testAddCards(count: number) {
        const {boardTree} = this.props
        const {board, activeView} = boardTree

        const startCount = boardTree?.cards?.length
        let optionIndex = 0

        for (let i = 0; i < count; i++) {
            const card = new MutableCard()
            card.parentId = boardTree.board.id
            card.properties = CardFilter.propertiesThatMeetFilterGroup(activeView.filter, board.cardProperties)
            if (boardTree.groupByProperty && boardTree.groupByProperty.options.length > 0) {
                // Cycle through options
                const option = boardTree.groupByProperty.options[optionIndex]
                optionIndex = (optionIndex + 1) % boardTree.groupByProperty.options.length
                card.properties[boardTree.groupByProperty.id] = option.id
                card.title = `Test Card ${startCount + i + 1}`
                card.icon = BlockIcons.shared.randomIcon()
            }
            await mutator.insertBlock(card, 'test add card')
        }
    }

    private async testRandomizeIcons() {
        const {boardTree} = this.props

        for (const card of boardTree.cards) {
            mutator.changeIcon(card, BlockIcons.shared.randomIcon(), 'randomize icon')
        }
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

    private onSearchKeyDown(e: React.KeyboardEvent) {
        if (e.keyCode === 27) { // ESC: Clear search
            this.searchFieldRef.current.text = ''
            this.setState({isSearching: false})
            this.props.setSearchText(undefined)
            e.preventDefault()
        }
    }

    private searchChanged(text?: string) {
        this.props.setSearchText(text)
    }
}

export {BoardComponent}
