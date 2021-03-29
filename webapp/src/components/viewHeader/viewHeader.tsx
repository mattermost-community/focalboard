// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import {BlockIcons} from '../../blockIcons'
import {MutableCard} from '../../blocks/card'
import {CardFilter} from '../../cardFilter'
import ViewMenu from '../../components/viewMenu'
import {Constants} from '../../constants'
import {CsvExporter} from '../../csvExporter'
import mutator from '../../mutator'
import {BoardTree} from '../../viewModel/boardTree'
import Button from '../../widgets/buttons/button'
import IconButton from '../../widgets/buttons/iconButton'
import DropdownIcon from '../../widgets/icons/dropdown'
import MenuWrapper from '../../widgets/menuWrapper'

import Editable from '../editable'
import FilterComponent from '../filterComponent'
import ModalWrapper from '../modalWrapper'
import {sendFlashMessage} from '../flashMessages'

import NewCardButton from './newCardButton'
import ViewHeaderPropertiesMenu from './viewHeaderPropertiesMenu'
import ViewHeaderGroupByMenu from './viewHeaderGroupByMenu'
import ViewHeaderSortMenu from './viewHeaderSortMenu'
import ViewHeaderActionsMenu from './viewHeaderActionsMenu'

import './viewHeader.scss'

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
}

class ViewHeader extends React.Component<Props, State> {
    private searchFieldRef = React.createRef<Editable>()

    shouldComponentUpdate(): boolean {
        return true
    }

    constructor(props: Props) {
        super(props)
        this.state = {isSearching: Boolean(this.props.boardTree.getSearchText()), showFilter: false}
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

                    <ViewHeaderPropertiesMenu
                        properties={boardTree.board.cardProperties}
                        activeView={boardTree.activeView}
                    />

                    {/* Group by */}

                    {withGroupBy &&
                        <ViewHeaderGroupByMenu
                            properties={boardTree.board.cardProperties}
                            activeView={boardTree.activeView}
                            groupByPropertyName={boardTree.groupByProperty?.name}
                        />}

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

                    <ViewHeaderSortMenu
                        properties={boardTree.board.cardProperties}
                        activeView={boardTree.activeView}
                        orderedCards={boardTree.orderedCards()}
                    />
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
                    <ViewHeaderActionsMenu
                        boardTree={this.props.boardTree}
                    />

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
}

export default injectIntl(ViewHeader)
