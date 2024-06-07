// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useEffect} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

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

import {useAppSelector} from '../../store/hooks'
import {Permission} from '../../constants'
import {useHasCurrentBoardPermissions} from '../../hooks/permissions'
import {
    getOnboardingTourCategory,
    getOnboardingTourStarted,
    getOnboardingTourStep,
} from '../../store/users'
import {
    BoardTourSteps,
    TOUR_BOARD,
    TourCategoriesMapToSteps,
} from '../onboardingTour'
import {OnboardingBoardTitle} from '../cardDetail/cardDetail'
import AddViewTourStep from '../onboardingTour/addView/add_view'
import {getCurrentCard} from '../../store/cards'
import BoardPermissionGate from '../permissions/boardPermissionGate'

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
    dateDisplayProperty?: IPropertyTemplate
}

const ViewHeader = (props: Props) => {
    const [showFilter, setShowFilter] = useState(false)
    const [lockFilterOnClose, setLockFilterOnClose] = useState(false)
    const intl = useIntl()
    const canEditBoardProperties = useHasCurrentBoardPermissions([Permission.ManageBoardProperties])

    const {board, activeView, views, groupByProperty, cards, dateDisplayProperty} = props

    const withGroupBy = activeView.fields.viewType === 'board' || activeView.fields.viewType === 'table'
    const withDisplayBy = activeView.fields.viewType === 'calendar'
    const withSortBy = activeView.fields.viewType !== 'calendar'

    const [viewTitle, setViewTitle] = useState(activeView.title)

    useEffect(() => {
        setViewTitle(activeView.title)
    }, [activeView.title])

    const hasFilter = activeView.fields.filter && activeView.fields.filter.filters?.length > 0

    const isOnboardingBoard = props.board.title === OnboardingBoardTitle
    const onboardingTourStarted = useAppSelector(getOnboardingTourStarted)
    const onboardingTourCategory = useAppSelector(getOnboardingTourCategory)
    const onboardingTourStep = useAppSelector(getOnboardingTourStep)

    const currentCard = useAppSelector(getCurrentCard)
    const noCardOpen = !currentCard

    const showTourBaseCondition = isOnboardingBoard &&
        onboardingTourStarted &&
        noCardOpen &&
        onboardingTourCategory === TOUR_BOARD &&
        onboardingTourStep === BoardTourSteps.ADD_VIEW.toString()

    const [delayComplete, setDelayComplete] = useState(false)

    useEffect(() => {
        if (showTourBaseCondition) {
            setTimeout(() => {
                setDelayComplete(true)
            }, 800)
        }
    }, [showTourBaseCondition])

    useEffect(() => {
        if (!BoardTourSteps.SHARE_BOARD) {
            BoardTourSteps.SHARE_BOARD = 2
        }

        TourCategoriesMapToSteps[TOUR_BOARD] = BoardTourSteps
    }, [])

    const showAddViewTourStep = showTourBaseCondition && delayComplete

    return (
        <div className='ViewHeader'>
            <div className='viewSelector'>
                <Editable
                    value={viewTitle}
                    placeholderText='Untitled View'
                    onSave={(): void => {
                        mutator.changeBlockTitle(activeView.boardId, activeView.id, activeView.title, viewTitle)
                    }}
                    onCancel={(): void => {
                        setViewTitle(activeView.title)
                    }}
                    onChange={setViewTitle}
                    saveOnEsc={true}
                    readonly={props.readonly || !canEditBoardProperties}
                    spellCheck={true}
                    autoExpand={false}
                />
                {!props.readonly && (<div>
                    <MenuWrapper label={intl.formatMessage({id: 'ViewHeader.view-menu', defaultMessage: 'View menu'})}>
                        <IconButton icon={<DropdownIcon/>}/>
                        <ViewMenu
                            board={board}
                            activeView={activeView}
                            views={views}
                            readonly={props.readonly || !canEditBoardProperties}
                        />
                    </MenuWrapper>
                    {showAddViewTourStep && <AddViewTourStep/>}
                </div>)}

            </div>

            <div className='octo-spacer'/>

            {!props.readonly && canEditBoardProperties &&
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
                    groupByProperty={groupByProperty}
                />}

                {/* Display by */}

                {withDisplayBy &&
                <ViewHeaderDisplayByMenu
                    properties={board.cardProperties}
                    activeView={activeView}
                    dateDisplayPropertyName={dateDisplayProperty?.name}
                />}

                {/* Filter */}

                <ModalWrapper>
                    <Button
                        active={hasFilter}
                        onClick={() => setShowFilter(!showFilter)}
                        onMouseOver={() => setLockFilterOnClose(true)}
                        onMouseLeave={() => setLockFilterOnClose(false)}
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
                        onClose={() => {
                            if (!lockFilterOnClose) {
                                setShowFilter(false)
                            }
                        }}
                    />}
                </ModalWrapper>

                {/* Sort */}

                {withSortBy &&
                <ViewHeaderSortMenu
                    properties={board.cardProperties}
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
                />

                {/* New card button */}

                <BoardPermissionGate permissions={[Permission.ManageBoardCards]}>
                    <NewCardButton
                        addCard={props.addCard}
                        addCardFromTemplate={props.addCardFromTemplate}
                        addCardTemplate={props.addCardTemplate}
                        editCardTemplate={props.editCardTemplate}
                    />
                </BoardPermissionGate>
            </>}
        </div>
    )
}

export default React.memo(ViewHeader)
