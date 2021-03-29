// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import ViewMenu from '../../components/viewMenu'
import mutator from '../../mutator'
import {BoardTree} from '../../viewModel/boardTree'
import Button from '../../widgets/buttons/button'
import IconButton from '../../widgets/buttons/iconButton'
import DropdownIcon from '../../widgets/icons/dropdown'
import MenuWrapper from '../../widgets/menuWrapper'

import Editable from '../editable'
import FilterComponent from '../filterComponent'
import ModalWrapper from '../modalWrapper'

import NewCardButton from './newCardButton'
import ViewHeaderPropertiesMenu from './viewHeaderPropertiesMenu'
import ViewHeaderGroupByMenu from './viewHeaderGroupByMenu'
import ViewHeaderSortMenu from './viewHeaderSortMenu'
import ViewHeaderActionsMenu from './viewHeaderActionsMenu'
import ViewHeaderSearch from './viewHeaderSearch'

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
    readonly: boolean
}

type State = {
    showFilter: boolean
}

class ViewHeader extends React.Component<Props, State> {
    shouldComponentUpdate(): boolean {
        return true
    }

    constructor(props: Props) {
        super(props)
        this.state = {showFilter: false}
    }

    render(): JSX.Element {
        const {boardTree, showView, withGroupBy} = this.props
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

                <ViewHeaderSearch
                    boardTree={this.props.boardTree}
                    setSearchText={this.props.setSearchText}
                />

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
}

export default ViewHeader
