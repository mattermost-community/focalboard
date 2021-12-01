// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useEffect} from 'react'
import {FormattedMessage} from 'react-intl'

import ViewMenu from '../../components/viewMenu'
import mutator from '../../mutator'
import {Board, IPropertyTemplate} from '../../blocks/board'
import {BoardView} from '../../blocks/boardView'
import {Card} from '../../blocks/card'
import Button from '../../widgets/buttons/button'
import IconButton from '../../widgets/buttons/iconButton'
import DropdownIcon from '../../widgets/icons/dropdown'
import MenuWrapper from '../../widgets/menuWrapper'
import Editable from '../../widgets/editable'

import ModalWrapper from '../modalWrapper'

import NewCardButton from './newCardButton'
import ViewHeaderPropertiesMenu from './viewHeaderPropertiesMenu'
import ViewHeaderGroupByMenu from './viewHeaderGroupByMenu'
import ViewHeaderDisplayByMenu from './viewHeaderDisplayByMenu'
import ViewHeaderSortMenu from './viewHeaderSortMenu'
import ViewHeaderActionsMenu from './viewHeaderActionsMenu'
import ViewHeaderSearch from './viewHeaderSearch'
import FilterComponent from './filterComponent'

import './viewHeader.scss'

type Props = {
    board: Board
    activeView: BoardView
    views: BoardView[]
    cards: Card[]
    groupByProperty?: IPropertyTemplate
    addCard: () => void
    addCardFromTemplate: (cardTemplateId: string) => void
    addCardTemplate: () => void
    editCardTemplate: (cardTemplateId: string) => void
    readonly: boolean
    showShared: boolean
    dateDisplayProperty?: IPropertyTemplate
}

const ViewHeader = React.memo((props: Props) => {
    const [showFilter, setShowFilter] = useState(false)

    const {board, activeView, views, groupByProperty, cards, showShared, dateDisplayProperty} = props

    const withGroupBy = activeView.fields.viewType === 'board' || activeView.fields.viewType === 'table'
    const withDisplayBy = activeView.fields.viewType === 'calendar'
    const withSortBy = activeView.fields.viewType !== 'calendar'

    const [viewTitle, setViewTitle] = useState(activeView.title)

    useEffect(() => {
        setViewTitle(activeView.title)
    }, [activeView.title])

    const hasFilter = activeView.fields.filter && activeView.fields.filter.filters?.length > 0

    return (
        <div className='ViewHeader'>
            <Editable
                value={viewTitle}
                placeholderText='Untitled View'
                onSave={(): void => {
                    mutator.changeTitle(activeView.id, activeView.title, viewTitle)
                }}
                onCancel={(): void => {
                    setViewTitle(activeView.title)
                }}
                onChange={setViewTitle}
                saveOnEsc={true}
                readonly={props.readonly}
                spellCheck={true}
                autoExpand={false}
            />
            <MenuWrapper>
                <IconButton icon={<DropdownIcon/>}/>
                <ViewMenu
                    board={board}
                    activeView={activeView}
                    views={views}
                    readonly={props.readonly}
                />
            </MenuWrapper>

            <div className='octo-spacer'/>

            {!props.readonly &&
            <>
                {/* Card properties */}

                <ViewHeaderPropertiesMenu
                    properties={board.fields.cardProperties}
                    activeView={activeView}
                />

                {/* Group by */}

                {withGroupBy &&
                    <ViewHeaderGroupByMenu
                        properties={board.fields.cardProperties}
                        activeView={activeView}
                        groupByPropertyName={groupByProperty?.name}
                    />}

                {/* Display by */}

                {withDisplayBy &&
                    <ViewHeaderDisplayByMenu
                        properties={board.fields.cardProperties}
                        activeView={activeView}
                        dateDisplayPropertyName={dateDisplayProperty?.name}
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
                        board={board}
                        activeView={activeView}
                        onClose={() => setShowFilter(false)}
                    />}
                </ModalWrapper>

                {/* Sort */}

                {withSortBy &&
                    <ViewHeaderSortMenu
                        properties={board.fields.cardProperties}
                        activeView={activeView}
                        orderedCards={cards}
                    />
                }
            </>
            }

            {/* Search */}

            <ViewHeaderSearch/>

            {/* Options menu */}

            {!props.readonly &&
            <>
                <ViewHeaderActionsMenu
                    board={board}
                    activeView={activeView}
                    cards={cards}
                    showShared={showShared}
                />

                {/* New card button */}

                <NewCardButton
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
