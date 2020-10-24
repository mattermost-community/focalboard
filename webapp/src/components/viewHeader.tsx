// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import {Archiver} from '../archiver'
import {ISortOption} from '../blocks/boardView'
import {BlockIcons} from '../blockIcons'
import {MutableCard} from '../blocks/card'
import {BoardTree} from '../viewModel/boardTree'
import ViewMenu from '../components/viewMenu'
import {CsvExporter} from '../csvExporter'
import {CardFilter} from '../cardFilter'
import mutator from '../mutator'
import {Utils} from '../utils'
import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'

import {Editable} from './editable'
import {FilterComponent} from './filterComponent'

type Props = {
    boardTree?: BoardTree
    showView: (id: string) => void
    setSearchText: (text: string) => void
    addCard: (show: boolean) => void
    withGroupBy?: boolean
}

type State = {
    isSearching: boolean
    showFilter: boolean
}

export default class ViewHeader extends React.Component<Props, State> {
    private searchFieldRef = React.createRef<Editable>()

    shouldComponentUpdate(): boolean {
        return true
    }

    constructor(props: Props) {
        super(props)
        this.state = {isSearching: Boolean(this.props.boardTree?.getSearchText()), showFilter: false}
    }

    componentDidUpdate(prevPros: Props, prevState: State): void {
        if (this.state.isSearching && !prevState.isSearching) {
            this.searchFieldRef.current.focus()
        }
    }

    private filterClicked = () => {
        this.setState({showFilter: true})
    }

    private hideFilter = () => {
        this.setState({showFilter: false})
    }

    private onSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.keyCode === 27) { // ESC: Clear search
            this.searchFieldRef.current.text = ''
            this.setState({...this.state, isSearching: false})
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

    render(): JSX.Element {
        const {boardTree, showView, withGroupBy} = this.props
        const {board, activeView} = boardTree

        const hasFilter = activeView.filter && activeView.filter.filters?.length > 0
        const hasSort = activeView.sortOptions.length > 0

        return (
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
                            id='ViewHeader.properties'
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
                {withGroupBy &&
                    <MenuWrapper>
                        <div
                            className='octo-button'
                            id='groupByButton'
                        >
                            <FormattedMessage
                                id='ViewHeader.group-by'
                                defaultMessage='Group by {property}'
                                values={{
                                    property: (
                                        <span
                                            style={{color: '#000000'}}
                                            id='groupByLabel'
                                        >
                                            {boardTree.groupByProperty?.name}
                                        </span>
                                    ),
                                }}
                            />
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
                    </MenuWrapper>}
                <div
                    className={hasFilter ? 'octo-button active' : 'octo-button'}
                    style={{position: 'relative', overflow: 'unset'}}
                    onClick={this.filterClicked}
                >
                    <FormattedMessage
                        id='ViewHeader.filter'
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
                            id='ViewHeader.sort'
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
                {this.state.isSearching &&
                    <FormattedMessage
                        id='ViewHeader.search-text'
                        defaultMessage='Search text'
                    >
                        {(placeholder: string) => (
                            <Editable
                                ref={this.searchFieldRef}
                                text={boardTree.getSearchText()}
                                placeholderText={placeholder}
                                style={{color: '#000000'}}
                                onChanged={(text) => {
                                    this.searchChanged(text)
                                }}
                                onKeyDown={(e) => {
                                    this.onSearchKeyDown(e)
                                }}
                            />
                        )}
                    </FormattedMessage>}
                {!this.state.isSearching &&
                    <div
                        className='octo-button'
                        onClick={() => {
                            this.setState({...this.state, isSearching: true})
                        }}
                    >
                        <FormattedMessage
                            id='ViewHeader.search'
                            defaultMessage='Search'
                        />
                    </div>}
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
                        this.props.addCard(true)
                    }}
                >
                    <FormattedMessage
                        id='ViewHeader.new'
                        defaultMessage='New'
                    />
                </div>
            </div>
        )
    }
}
