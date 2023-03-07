// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useMemo, useState} from 'react'
import {useIntl} from 'react-intl'

import {useIsCardEmpty} from '../../hooks/useIsCardEmpty'
import mutator from '../../mutator'

import {Board, IPropertyTemplate} from '../../blocks/board'
import {Card} from '../../blocks/card'
import Tooltip from '../../widgets/tooltip'
import PropertyValueElement from '../propertyValueElement'
import CardBadges from '../cardBadges'
import ConfirmationDialogBox, {ConfirmationDialogBoxProps} from '../confirmationDialogBox'

import './fullcalendar.scss'
import MenuWrapper from '../../widgets/menuWrapper'
import CardActionsMenu from '../cardActionsMenu/cardActionsMenu'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'
import CardActionsMenuIcon from '../cardActionsMenu/cardActionsMenuIcon'

type Props = {
    card: Card
    board: Board
    visiblePropertyTemplates: IPropertyTemplate[]
    visibleBadges: boolean
    readonly: boolean
    showCard: (cardId: string) => void
}

const FullCalendarCard = (props: Props): JSX.Element|null => {
    const {card, board, visiblePropertyTemplates, visibleBadges} = props
    const isCardEmpty = useIsCardEmpty(card)
    const intl = useIntl()
    const [showConfirmationDialogBox, setShowConfirmationDialogBox] = useState<boolean>(false)

    const handleDeleteCard = useCallback(() => {
        if (!card) {
            return
        }
        mutator.deleteBlock(card, 'delete card')
        setShowConfirmationDialogBox(false)
    }, [card, board.id])

    const handleDeleteButtonOnClick = useCallback(() => {
        // user trying to delete a card with blank name
        // but content present cannot be deleted without
        // confirmation dialog
        if (isCardEmpty) {
            handleDeleteCard()
            return
        }
        setShowConfirmationDialogBox(true)
    }, [handleDeleteCard, isCardEmpty])

    const confirmDialogProps: ConfirmationDialogBoxProps = useMemo(() => {
        return {
            heading: intl.formatMessage({id: 'CardDialog.delete-confirmation-dialog-heading', defaultMessage: 'Confirm card delete!'}),
            confirmButtonText: intl.formatMessage({id: 'CardDialog.delete-confirmation-dialog-button-text', defaultMessage: 'Delete'}),
            onConfirm: handleDeleteCard,
            onClose: () => {
                setShowConfirmationDialogBox(false)
            },
        }
    }, [handleDeleteCard])

    return (<>
        <div
            className='EventContent'
            onClick={() => props.showCard(card.id)}
        >
            {!props.readonly &&
            <MenuWrapper
                className='optionsMenu'
                stopPropagationOnToggle={true}
            >
                <CardActionsMenuIcon/>
                <CardActionsMenu
                    cardId={card.id}
                    boardId={card.boardId}
                    onClickDelete={handleDeleteButtonOnClick}
                    onClickDuplicate={() => {
                        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DuplicateCard, {board: board.id, card: card.id})
                        mutator.duplicateCard(card.id, board.id)
                    }}
                />
            </MenuWrapper>}
            <div className='octo-icontitle'>
                { card.fields.icon ? <div className='octo-icon'>{card.fields.icon}</div> : undefined }
                <div
                    className='fc-event-title'
                    key='__title'
                >{card.title || intl.formatMessage({id: 'CalendarCard.untitled', defaultMessage: 'Untitled'})}</div>
            </div>
            {visiblePropertyTemplates.map((template) => (
                <Tooltip
                    key={template.id}
                    title={template.name}
                >
                    <PropertyValueElement
                        board={board}
                        readOnly={true}
                        card={card}
                        propertyTemplate={template}
                        showEmptyPlaceholder={false}
                    />
                </Tooltip>
            ))}
            {visibleBadges &&
            <CardBadges card={card}/> }
        </div>
        {showConfirmationDialogBox && <ConfirmationDialogBox dialogBox={confirmDialogProps}/>}
    </>)
}

export default React.memo(FullCalendarCard)
