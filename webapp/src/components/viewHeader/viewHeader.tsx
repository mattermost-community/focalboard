// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {FormattedMessage} from 'react-intl'

import ViewMenu from '../../components/viewMenu'
import mutator from '../../mutator'
import {BoardTree} from '../../viewModel/boardTree'
import Button from '../../widgets/buttons/button'
import IconButton from '../../widgets/buttons/iconButton'
import DropdownIcon from '../../widgets/icons/dropdown'
import MenuWrapper from '../../widgets/menuWrapper'

import Editable from '../editable'
import ModalWrapper from '../modalWrapper'

import NewCardButton from './newCardButton'
import ViewHeaderPropertiesMenu from './viewHeaderPropertiesMenu'
import ViewHeaderGroupByMenu from './viewHeaderGroupByMenu'
import ViewHeaderSortMenu from './viewHeaderSortMenu'
import ViewHeaderActionsMenu from './viewHeaderActionsMenu'
import ViewHeaderSearch from './viewHeaderSearch'
import FilterComponent from './filterComponent'

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

const ViewHeader = React.memo((props: Props) => {
    const [showFilter, setShowFilter] = useState(false)

    const {boardTree, showView, withGroupBy} = props
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
                readonly={props.readonly}
            />
            <MenuWrapper>
                <IconButton icon={<DropdownIcon/>}/>
                <ViewMenu
                    board={board}
                    boardTree={boardTree}
                    showView={showView}
                    readonly={props.readonly}
                />
            </MenuWrapper>

            <div className='octo-spacer'/>

            {!props.readonly &&
            <>
                {/* Card properties */}

                <ViewHeaderPropertiesMenu
                    properties={board.cardProperties}
                    activeView={activeView}
                />

                {/* Group by */}

                {withGroupBy &&
                    <ViewHeaderGroupByMenu
                        properties={board.cardProperties}
                        activeView={activeView}
                        groupByPropertyName={boardTree.groupByProperty?.name}
                    />}

                {/* Filter */}

                <ModalWrapper>
                    <Button
                        active={hasFilter}
                        onClick={() => setShowFilter(true)}
                    >
                        <FormattedMessage
                            id='ViewHeader.filter'
                            defaultMessage='Filter'
                        />
                    </Button>
                    {showFilter &&
                    <FilterComponent
                        boardTree={boardTree}
                        onClose={() => setShowFilter(false)}
                    />}
                </ModalWrapper>

                {/* Sort */}

                <ViewHeaderSortMenu
                    properties={board.cardProperties}
                    activeView={activeView}
                    orderedCards={boardTree.orderedCards()}
                />
            </>
            }

            {/* Search */}

            <ViewHeaderSearch
                boardTree={boardTree}
                setSearchText={props.setSearchText}
            />

            {/* Options menu */}

            {!props.readonly &&
            <>
                <ViewHeaderActionsMenu
                    boardTree={boardTree}
                />

                {/* New card button */}

                <NewCardButton
                    boardTree={boardTree}
                    addCard={props.addCard}
                    addCardFromTemplate={props.addCardFromTemplate}
                    addCardTemplate={props.addCardTemplate}
                    editCardTemplate={props.editCardTemplate}
                />
            </>
            }
        </div>
    )
})

export default ViewHeader
