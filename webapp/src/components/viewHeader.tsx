// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import {BlockIcons} from '../blockIcons'
import {IPropertyTemplate} from '../blocks/board'
import {ISortOption, MutableBoardView} from '../blocks/boardView'
import {MutableCard} from '../blocks/card'
import {CardFilter} from '../cardFilter'
import ViewMenu from '../components/viewMenu'
import {Constants} from '../constants'
import {CsvExporter} from '../csvExporter'
import mutator from '../mutator'
import {UserContext} from '../user'
import {BoardTree} from '../viewModel/boardTree'
import Button from '../widgets/buttons/button'
import IconButton from '../widgets/buttons/iconButton'
import CheckIcon from '../widgets/icons/check'
import DropdownIcon from '../widgets/icons/dropdown'
import OptionsIcon from '../widgets/icons/options'
import SortDownIcon from '../widgets/icons/sortDown'
import SortUpIcon from '../widgets/icons/sortUp'
import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'

import Editable from './editable'
import FilterComponent from './filterComponent'
import ModalWrapper from './modalWrapper'
import NewCardButton from './newCardButton'
import ShareBoardComponent from './shareBoardComponent'
import './viewHeader.scss'
import {sendFlashMessage} from './flashMessages'

type Props = {
    boardTree: BoardTree
    showView: (id: string) => void
    setSearchText: (text?: string) => void
    addCard: () => void
    addCardFromTemplate: (cardTemplateId: string) => void
    addCardTemplate: () => void
    editCardTemplate: (cardTemplateId: string) => void
    withGroupBy?: boolean
    intl: IntlShape
    readonly: boolean
}

type State = {
    isSearching: boolean
    showFilter: boolean
    showShareDialog: boolean
}

class ViewHeader extends React.Component<Props, State> {
    private searchFieldRef = React.createRef<Editable>()

    shouldComponentUpdate(): boolean {
        return true
    }

    constructor(props: Props) {
        super(props)
        this.state = {isSearching: Boolean(this.props.boardTree.getSearchText()), showFilter: false, showShareDialog: false}
    }

    componentDidUpdate(prevPros: Props, prevState: State): void {
        if (this.state.isSearching && !prevState.isSearching) {
            this.searchFieldRef.current?.focus()
        }
    }

    onExportCsvTrigger(boardTree: BoardTree) {
        try {
            CsvExporter.exportTableCsv(boardTree)
            const exportCompleteMessage = this.props.intl.formatMessage({
                id: 'ViewHeader.export-complete',
                defaultMessage: 'Export complete!',
            })
            sendFlashMessage({content: exportCompleteMessage, severity: 'normal'})
        } catch (e) {
            const exportFailedMessage = this.props.intl.formatMessage({
                id: 'ViewHeader.export-failed',
                defaultMessage: 'Export failed!',
            })
            sendFlashMessage({content: exportFailedMessage, severity: 'high'})
        }
    }

    render(): JSX.Element {
        const {boardTree, showView, withGroupBy, intl} = this.props
        const {board, activeView} = boardTree

        const hasFilter = activeView.filter && activeView.filter.filters?.length > 0
        const hasSort = activeView.sortOptions.length > 0

        return (
            <div className='ViewHeader'>
                <Editable
                    style={{color: 'rgb(var(--main-fg))', fontWeight: 600}}
                    text={activeView.title}
                    placeholderText='Untitled View'
                    onChanged={(text) => {
                        mutator.changeTitle(activeView, text)
                    }}
                    readonly={this.props.readonly}
                />
                <MenuWrapper>
                    <IconButton icon={<DropdownIcon/>}/>
                    <ViewMenu
                        board={board}
                        boardTree={boardTree}
                        showView={showView}
                        readonly={this.props.readonly}
                    />
                </MenuWrapper>

                <div className='octo-spacer'/>

                {!this.props.readonly &&
                <>
                    {/* Card properties */}

                    <MenuWrapper>
                        <Button>
                            <FormattedMessage
                                id='ViewHeader.properties'
                                defaultMessage='Properties'
                            />
                        </Button>
                        <Menu>
                            {boardTree.board.cardProperties.map((option: IPropertyTemplate) => (
                                <Menu.Switch
                                    key={option.id}
                                    id={option.id}
                                    name={option.name}
                                    isOn={activeView.visiblePropertyIds.includes(option.id)}
                                    onClick={(propertyId: string) => {
                                        let newVisiblePropertyIds = []
                                        if (activeView.visiblePropertyIds.includes(propertyId)) {
                                            newVisiblePropertyIds = activeView.visiblePropertyIds.filter((o: string) => o !== propertyId)
                                        } else {
                                            newVisiblePropertyIds = [...activeView.visiblePropertyIds, propertyId]
                                        }
                                        mutator.changeViewVisibleProperties(activeView, newVisiblePropertyIds)
                                    }}
                                />
                            ))}
                        </Menu>
                    </MenuWrapper>

                    {/* Group by */}

                    {withGroupBy &&
                    <MenuWrapper>
                        <Button>
                            <FormattedMessage
                                id='ViewHeader.group-by'
                                defaultMessage='Group by: {property}'
                                values={{
                                    property: (
                                        <span
                                            style={{color: 'rgb(var(--main-fg))'}}
                                            id='groupByLabel'
                                        >
                                            {boardTree.groupByProperty?.name}
                                        </span>
                                    ),
                                }}
                            />
                        </Button>
                        <Menu>
                            {boardTree.board.cardProperties.filter((o: IPropertyTemplate) => o.type === 'select').map((option: IPropertyTemplate) => (
                                <Menu.Text
                                    key={option.id}
                                    id={option.id}
                                    name={option.name}
                                    rightIcon={boardTree.activeView.groupById === option.id ? <CheckIcon/> : undefined}
                                    onClick={(id) => {
                                        if (boardTree.activeView.groupById === id) {
                                            return
                                        }

                                        mutator.changeViewGroupById(boardTree.activeView, id)
                                    }}
                                />
                            ))}
                        </Menu>
                    </MenuWrapper>}

                    {/* Filter */}

                    <ModalWrapper>
                        <Button
                            active={hasFilter}
                            onClick={this.showFilterDialog}
                        >
                            <FormattedMessage
                                id='ViewHeader.filter'
                                defaultMessage='Filter'
                            />
                        </Button>
                        {this.state.showFilter &&
                        <FilterComponent
                            boardTree={boardTree}
                            onClose={this.hideFilterDialog}
                        />}
                    </ModalWrapper>

                    {/* Sort */}

                    <MenuWrapper>
                        <Button active={hasSort}>
                            <FormattedMessage
                                id='ViewHeader.sort'
                                defaultMessage='Sort'
                            />
                        </Button>
                        <Menu>
                            {(activeView.sortOptions.length > 0) &&
                            <>
                                <Menu.Text
                                    id='manual'
                                    name='Manual'
                                    onClick={() => {
                                        // This sets the manual card order to the currently displayed order
                                        // Note: Perform this as a single update to change both properties correctly
                                        const newView = new MutableBoardView(activeView)
                                        newView.cardOrder = boardTree.orderedCards().map((o) => o.id)
                                        newView.sortOptions = []
                                        mutator.updateBlock(newView, activeView, 'reorder')
                                    }}
                                />

                                <Menu.Text
                                    id='revert'
                                    name='Revert'
                                    onClick={() => {
                                        mutator.changeViewSortOptions(activeView, [])
                                    }}
                                />

                                <Menu.Separator/>
                            </>
                            }

                            {this.sortDisplayOptions().map((option) => {
                                let rightIcon: JSX.Element | undefined
                                if (activeView.sortOptions.length > 0) {
                                    const sortOption = activeView.sortOptions[0]
                                    if (sortOption.propertyId === option.id) {
                                        rightIcon = sortOption.reversed ? <SortUpIcon/> : <SortDownIcon/>
                                    }
                                }
                                return (
                                    <Menu.Text
                                        key={option.id}
                                        id={option.id}
                                        name={option.name}
                                        rightIcon={rightIcon}
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
                                )
                            })}
                        </Menu>
                    </MenuWrapper>
                </>
                }

                {/* Search */}

                {this.state.isSearching &&
                    <Editable
                        ref={this.searchFieldRef}
                        text={boardTree.getSearchText()}
                        placeholderText={intl.formatMessage({id: 'ViewHeader.search-text', defaultMessage: 'Search text'})}
                        style={{color: 'rgb(var(--main-fg))'}}
                        onChanged={(text) => {
                            this.searchChanged(text)
                        }}
                        onKeyDown={(e) => {
                            this.onSearchKeyDown(e)
                        }}
                    />
                }

                {!this.state.isSearching &&
                    <Button onClick={() => this.setState({isSearching: true})}>
                        <FormattedMessage
                            id='ViewHeader.search'
                            defaultMessage='Search'
                        />
                    </Button>}

                {/* Options menu */}

                {!this.props.readonly &&
                <>
                    <ModalWrapper>
                        <MenuWrapper>
                            <IconButton icon={<OptionsIcon/>}/>
                            <Menu>
                                <Menu.Text
                                    id='exportCsv'
                                    name={intl.formatMessage({id: 'ViewHeader.export-csv', defaultMessage: 'Export to CSV'})}
                                    onClick={() => this.onExportCsvTrigger(boardTree)}
                                />
                                {/* <Menu.Text
                                    id='exportBoardArchive'
                                    name={intl.formatMessage({id: 'ViewHeader.export-board-archive', defaultMessage: 'Export board archive'})}
                                    onClick={() => Archiver.exportBoardTree(boardTree)}
                                /> */}
                                <UserContext.Consumer>
                                    {(user) => (user && user.id !== 'single-user' &&
                                        <Menu.Text
                                            id='shareBoard'
                                            name={intl.formatMessage({id: 'ViewHeader.share-board', defaultMessage: 'Share board'})}
                                            onClick={this.showShareDialog}
                                        />
                                    )}
                                </UserContext.Consumer>

                                {/*

                            <Menu.Separator/>

                            <Menu.Text
                                id='testAdd100Cards'
                                name={intl.formatMessage({id: 'ViewHeader.test-add-100-cards', defaultMessage: 'TEST: Add 100 cards'})}
                                onClick={() => this.testAddCards(100)}
                            />
                            <Menu.Text
                                id='testAdd1000Cards'
                                name={intl.formatMessage({id: 'ViewHeader.test-add-1000-cards', defaultMessage: 'TEST: Add 1,000 cards'})}
                                onClick={() => this.testAddCards(1000)}
                            />
                            <Menu.Text
                                id='testDistributeCards'
                                name={intl.formatMessage({id: 'ViewHeader.test-distribute-cards', defaultMessage: 'TEST: Distribute cards'})}
                                onClick={() => this.testDistributeCards()}
                            />
                            <Menu.Text
                                id='testRandomizeIcons'
                                name={intl.formatMessage({id: 'ViewHeader.test-randomize-icons', defaultMessage: 'TEST: Randomize icons'})}
                                onClick={() => this.testRandomizeIcons()}
                            />

                            */}
                            </Menu>
                        </MenuWrapper>
                        {this.state.showShareDialog &&
                            <ShareBoardComponent
                                boardId={this.props.boardTree.board.id}
                                onClose={this.hideShareDialog}
                            />
                        }
                    </ModalWrapper>

                    {/* New card button */}

                    <NewCardButton
                        boardTree={this.props.boardTree}
                        addCard={this.props.addCard}
                        addCardFromTemplate={this.props.addCardFromTemplate}
                        addCardTemplate={this.props.addCardTemplate}
                        editCardTemplate={this.props.editCardTemplate}
                    />
                </>
                }
            </div>
        )
    }

    private showFilterDialog = () => {
        this.setState({showFilter: true})
    }

    private hideFilterDialog = () => {
        this.setState({showFilter: false})
    }

    private showShareDialog = () => {
        this.setState({showShareDialog: true})
    }

    private hideShareDialog = () => {
        this.setState({showShareDialog: false})
    }

    private onSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.keyCode === 27) { // ESC: Clear search
            if (this.searchFieldRef.current) {
                this.searchFieldRef.current.text = ''
            }
            this.setState({isSearching: false})
            this.props.setSearchText(undefined)
            e.preventDefault()
        }
    }

    private searchChanged(text?: string) {
        this.props.setSearchText(text)
    }

    private async testAddCards(count: number) {
        const {boardTree} = this.props
        const {board, activeView} = boardTree

        const startCount = boardTree.cards.length
        let optionIndex = 0

        mutator.performAsUndoGroup(async () => {
            for (let i = 0; i < count; i++) {
                const card = new MutableCard()
                card.parentId = boardTree.board.id
                card.rootId = boardTree.board.rootId
                card.properties = CardFilter.propertiesThatMeetFilterGroup(activeView.filter, board.cardProperties)
                card.title = `Test Card ${startCount + i + 1}`
                card.icon = BlockIcons.shared.randomIcon()

                if (boardTree.groupByProperty && boardTree.groupByProperty.options.length > 0) {
                    // Cycle through options
                    const option = boardTree.groupByProperty.options[optionIndex]
                    optionIndex = (optionIndex + 1) % boardTree.groupByProperty.options.length
                    card.properties[boardTree.groupByProperty.id] = option.id
                }
                mutator.insertBlock(card, 'test add card')
            }
        })
    }

    private async testDistributeCards() {
        const {boardTree} = this.props
        mutator.performAsUndoGroup(async () => {
            let optionIndex = 0
            for (const card of boardTree.cards) {
                if (boardTree.groupByProperty && boardTree.groupByProperty.options.length > 0) {
                    // Cycle through options
                    const option = boardTree.groupByProperty.options[optionIndex]
                    optionIndex = (optionIndex + 1) % boardTree.groupByProperty.options.length
                    const newCard = new MutableCard(card)
                    if (newCard.properties[boardTree.groupByProperty.id] !== option.id) {
                        newCard.properties[boardTree.groupByProperty.id] = option.id
                        mutator.updateBlock(newCard, card, 'test distribute cards')
                    }
                }
            }
        })
    }

    private async testRandomizeIcons() {
        const {boardTree} = this.props

        mutator.performAsUndoGroup(async () => {
            for (const card of boardTree.cards) {
                mutator.changeIcon(card, BlockIcons.shared.randomIcon(), 'randomize icon')
            }
        })
    }

    private sortDisplayOptions() {
        const {boardTree} = this.props

        const options = boardTree.board.cardProperties.map((o) => ({id: o.id, name: o.name}))
        options.unshift({id: Constants.titleColumnId, name: 'Name'})

        return options
    }
}

export default injectIntl(ViewHeader)
